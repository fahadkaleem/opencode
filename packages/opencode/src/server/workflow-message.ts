/**
 * Workflow Message Helper
 *
 * Creates and updates workflow status messages in the parent session.
 * This allows workflows to show up in the chat similar to Task tool calls.
 */

import { Session } from "../session"
import { Identifier } from "../id/id"
import { Instance } from "../project/instance"
import { MessageV2 } from "../session/message-v2"
import { Log } from "../util/log"
import { Storage } from "../storage/storage"
import { Locale } from "../util/locale"

const log = Log.create({ service: "workflow-message" })

export type WorkflowStep = {
  stepId: string
  displayName: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED"
  sessionId?: string
}

export type WorkflowMessageState = {
  userMessageId: string
  assistantMessageId: string
  partId: string
  sessionId: string
}

/**
 * Create a workflow message in the parent session.
 * Creates a user message (workflow trigger) and assistant message with workflow part.
 * Returns state needed to update the message as workflow progresses.
 */
export async function createWorkflowMessage(
  sessionId: string,
  executionId: string,
  workflowName: string,
  prompt: string,
  steps: WorkflowStep[],
): Promise<WorkflowMessageState> {
  const userMessageId = Identifier.ascending("message")
  const assistantMessageId = Identifier.ascending("message")
  const partId = Identifier.ascending("part")
  const now = Date.now()

  // Get existing messages to find the model from last user message
  const messages = await Session.messages({ sessionID: sessionId, limit: 10 })
  const lastUserMessage = messages.findLast((m) => m.info.role === "user")?.info as MessageV2.User | undefined

  // Use the same model as the last user message, or defaults
  const providerID = lastUserMessage?.model?.providerID ?? "anthropic"
  const modelID = lastUserMessage?.model?.modelID ?? "claude-sonnet-4-20250514"

  // Create user message showing the workflow execution request
  const userMessage: MessageV2.User = {
    id: userMessageId,
    sessionID: sessionId,
    role: "user",
    agent: "workflow",
    time: {
      created: now,
    },
    model: {
      providerID,
      modelID,
    },
  }

  await Session.updateMessage(userMessage)

  // Create user message text part with friendly workflow execution message
  const displayName = Locale.titlecase(workflowName.replace(/-/g, " "))
  const userTextPart: MessageV2.TextPart = {
    id: Identifier.ascending("part"),
    sessionID: sessionId,
    messageID: userMessageId,
    type: "text",
    text: `Execute ${displayName} Workflow\n\n${prompt}`,
  }

  await Session.updatePart(userTextPart)

  // Create assistant message
  const assistantMessage: MessageV2.Assistant = {
    id: assistantMessageId,
    sessionID: sessionId,
    role: "assistant",
    parentID: userMessageId,
    path: {
      cwd: Instance.directory,
      root: Instance.worktree,
    },
    cost: 0,
    modelID,
    providerID,
    mode: "workflow",
    agent: "workflow",
    tokens: {
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 },
    },
    time: {
      created: now,
    },
  }

  await Session.updateMessage(assistantMessage)

  // Create workflow tool part
  const part: MessageV2.ToolPart = {
    id: partId,
    sessionID: sessionId,
    messageID: assistantMessageId,
    type: "tool",
    callID: executionId,
    tool: "workflow",
    state: {
      status: "running",
      input: {
        workflowName,
        executionId,
      },
      title: workflowName,
      metadata: {
        workflowName,
        executionId,
        status: "RUNNING",
        steps,
        currentStepId: steps.find((s) => s.status === "RUNNING")?.stepId,
      },
      time: { start: now },
    },
  }

  await Session.updatePart(part)

  log.info("Created workflow message", { sessionId, userMessageId, assistantMessageId, partId, workflowName })

  return { userMessageId, assistantMessageId, partId, sessionId }
}

/**
 * Update workflow message with current step statuses.
 */
export async function updateWorkflowMessage(
  state: WorkflowMessageState,
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED",
  steps: WorkflowStep[],
  currentStepId?: string,
): Promise<void> {
  const now = Date.now()
  const existingPart = await getWorkflowPart(state)
  if (!existingPart) {
    log.warn("Workflow part not found for update", state)
    return
  }

  const isComplete = status === "COMPLETED" || status === "FAILED" || status === "CANCELLED"

  // Get workflow name from existing state
  const workflowName = (existingPart.state as any).input?.workflowName ?? "workflow"
  const executionId = (existingPart.state as any).input?.executionId ?? ""
  const startTime = (existingPart.state as any).time?.start ?? now

  let updatedPart: MessageV2.ToolPart

  if (isComplete) {
    updatedPart = {
      ...existingPart,
      state: {
        status: status === "COMPLETED" ? "completed" : "error",
        input: {
          workflowName,
          executionId,
        },
        output: status === "COMPLETED" ? "Workflow completed successfully" : `Workflow ${status.toLowerCase()}`,
        title: workflowName,
        metadata: {
          workflowName,
          executionId,
          status,
          steps,
          currentStepId,
        },
        time: { start: startTime, end: now },
        ...(status !== "COMPLETED" && { error: `Workflow ${status.toLowerCase()}` }),
      } as MessageV2.ToolStateCompleted | MessageV2.ToolStateError,
    }

    // Also mark the message as completed
    try {
      const message = await Storage.read<MessageV2.Assistant>(["message", state.sessionId, state.assistantMessageId])
      if (message) {
        await Session.updateMessage({
          ...message,
          time: { ...message.time, completed: now },
        })
      }
    } catch {
      // Message not found, ignore
    }
  } else {
    updatedPart = {
      ...existingPart,
      state: {
        status: "running",
        input: {
          workflowName,
          executionId,
        },
        title: workflowName,
        metadata: {
          workflowName,
          executionId,
          status,
          steps,
          currentStepId,
        },
        time: { start: startTime },
      },
    }
  }

  await Session.updatePart(updatedPart)
  log.info("Updated workflow message", { ...state, status, currentStepId })
}

/**
 * Get the workflow part from storage.
 */
async function getWorkflowPart(state: WorkflowMessageState): Promise<MessageV2.ToolPart | null> {
  try {
    const msg = await MessageV2.get({
      sessionID: state.sessionId,
      messageID: state.assistantMessageId,
    })
    const part = msg.parts.find((p) => p.id === state.partId)
    return part?.type === "tool" ? part : null
  } catch {
    return null
  }
}
