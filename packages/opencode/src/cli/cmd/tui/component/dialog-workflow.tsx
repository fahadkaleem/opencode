/**
 * Workflow Selector Dialog
 *
 * Two-step dialog: select workflow, then enter prompt.
 * Part of FloMaster TUI integration (TASK-13).
 */

import { createMemo, createSignal, onMount, Show } from "solid-js"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useSync, type WorkflowDefinition } from "@tui/context/sync"
import { useSDK } from "@tui/context/sdk"
import { useTheme } from "@tui/context/theme"
import { useRoute } from "@tui/context/route"
import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { useToast } from "@tui/ui/toast"

export function DialogWorkflowSelect() {
  const dialog = useDialog()
  const sync = useSync()

  onMount(() => {
    dialog.setSize("medium")
  })

  const options = createMemo((): DialogSelectOption<string>[] =>
    sync.data.workflow_definitions.map((wf: WorkflowDefinition) => ({
      title: wf.name,
      value: wf.name,
      description: wf.description || `${wf.stepCount} steps`,
    })),
  )

  return (
    <DialogSelect
      title="Select workflow"
      placeholder="Search workflows..."
      options={options()}
      onSelect={(option) => {
        // Open prompt dialog
        dialog.replace(() => <DialogWorkflowPrompt workflowName={option.value} />)
      }}
    />
  )
}

function DialogWorkflowPrompt(props: { workflowName: string }) {
  const dialog = useDialog()
  const sdk = useSDK()
  const { theme } = useTheme()
  const toast = useToast()
  const route = useRoute()
  const [prompt, setPrompt] = createSignal("")
  const [submitting, setSubmitting] = createSignal(false)

  async function handleSubmit() {
    const currentPrompt = prompt().trim()
    if (!currentPrompt || submitting()) return
    setSubmitting(true)

    try {
      // Get or create session for workflow
      // If on home screen, create a new session first
      let sessionID: string
      if (route.data.type === "session") {
        sessionID = route.data.sessionID
      } else {
        // Create a new session for the workflow
        const newSession = await sdk.client.session.create({})
        if (!newSession.data?.id) {
          throw new Error("Failed to create session for workflow")
        }
        sessionID = newSession.data.id
        // Navigate to the new session
        route.navigate({ type: "session", sessionID })
      }

      // Call server to start workflow
      const response = await fetch(`${sdk.url}/workflow/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowName: props.workflowName,
          prompt: currentPrompt,
          sessionID,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to start workflow")
      }

      dialog.clear()
      toast.show({ message: `Starting workflow: ${props.workflowName}`, variant: "info" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start workflow")
      setSubmitting(false)
    }
  }

  useKeyboard((evt) => {
    if (evt.name === "return" && !evt.shift) {
      evt.preventDefault()
      handleSubmit()
    }
  })

  return (
    <box flexDirection="column" gap={1} paddingLeft={4} paddingRight={4} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          Start Workflow
        </text>
        <text fg={theme.textMuted}>esc</text>
      </box>
      <box paddingTop={1}>
        <text fg={theme.text}>
          <b>Workflow:</b> {props.workflowName}
        </text>
      </box>
      <box paddingTop={1}>
        <text fg={theme.textMuted}>Enter task prompt:</text>
      </box>
      <box paddingTop={1}>
        <input
          value={prompt()}
          onInput={(e) => setPrompt(e)}
          focusedBackgroundColor={theme.backgroundPanel}
          cursorColor={theme.primary}
          focusedTextColor={theme.text}
          ref={(r) => setTimeout(() => r.focus(), 1)}
          placeholder="Describe what you want to accomplish..."
        />
      </box>
      <Show when={submitting()}>
        <box paddingTop={1}>
          <text fg={theme.warning}>Starting workflow...</text>
        </box>
      </Show>
      <box paddingTop={1}>
        <text fg={theme.textMuted}>Press Enter to start</text>
      </box>
    </box>
  )
}
