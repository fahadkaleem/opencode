/**
 * Orchestrator Types
 *
 * All type definitions for the workflow orchestration engine.
 */

/**
 * Position in the workflow canvas.
 */
export type Position = {
  readonly x: number
  readonly y: number
}

/**
 * Viewport state for the React Flow canvas.
 */
export type ViewPort = {
  readonly x: number
  readonly y: number
  readonly zoom: number
}

/**
 * Output port data - describes an output connection point.
 */
export type OutputPortData = {
  /** The data type this port outputs */
  readonly dataType: string
  /** Unique port identifier */
  readonly id: string
  /** Port display name */
  readonly name: string
  /** Acceptable output types */
  readonly outputTypes: readonly string[]
}

/**
 * Input port data - describes an input connection point.
 */
export type InputPortData = {
  /** The field name this port connects to */
  readonly fieldName: string
  /** Unique port identifier */
  readonly id: string
  /** Acceptable input types */
  readonly inputTypes: readonly string[]
  /** Port type identifier */
  readonly type: string
}

/**
 * Template field - defines a configurable input on a node.
 */
export type TemplateField = {
  /** Field identifier */
  readonly name: string
  /** Human-readable display name */
  readonly displayName: string
  /** Field type (string, number, boolean, etc.) */
  readonly type: string
  /** Current value */
  readonly value: unknown
  /** Whether field is required */
  readonly isRequired: boolean
  /** Whether field is in advanced section */
  readonly isAdvanced: boolean
  /** Acceptable input types for connections */
  readonly inputTypes?: readonly string[]
  /** Options for dropdown fields */
  readonly options?: readonly string[]
  /** Placeholder text */
  readonly placeholder?: string
  /** Help text */
  readonly info?: string
  /** Whether field is multiline */
  readonly isMultiline?: boolean
  /** Whether field accepts file input */
  readonly isFilePath?: boolean
  /** Default value */
  readonly default?: unknown
  /** List of acceptable values */
  readonly acceptedValues?: readonly string[]
  /** Whether to show field */
  readonly isVisible?: boolean
  /** Field load from database */
  readonly shouldLoadFromDatabase?: boolean
  /** Dynamic field */
  readonly isDynamic?: boolean
  /** Real-time refresh */
  readonly hasRealTimeRefresh?: boolean
  /** Refresh button */
  readonly hasRefreshButton?: boolean
  /** Title case formatting */
  readonly hasTitleCase?: boolean
}

/**
 * Output field - defines an output from a node.
 */
export type OutputField = {
  /** Output identifier */
  readonly name: string
  /** Human-readable display name */
  readonly displayName: string
  /** Method name to invoke for this output */
  readonly method: string
  /** Types this output can produce */
  readonly types: readonly string[]
  /** Currently selected output type */
  readonly selected?: string
  /** Whether this output is cacheable */
  readonly isCacheable?: boolean
  /** Whether this output allows loop connections */
  readonly allowsLoop?: boolean
  /** Whether this output is hidden */
  readonly isHidden?: boolean
  /** Proxy for another output */
  readonly proxy?: Readonly<{ id: string; field: string }>
}

/**
 * Node configuration - React Flow node data.
 * Note: In React Flow JSON, this is accessed via `data.node` for compatibility.
 */
export type NodeConfig = {
  /** Template fields (inputs) */
  readonly template: Readonly<Record<string, TemplateField>>
  /** Output definitions */
  readonly outputs: readonly OutputField[]
  /** Human-readable node name */
  readonly displayName: string
  /** Documentation URL or text */
  readonly documentation: string
  /** Base component classes this node extends */
  readonly baseClasses: readonly string[]
  /** Node description */
  readonly description?: string
  /** Whether this is a beta feature */
  readonly isBeta?: boolean
  /** Custom component code */
  readonly customComponentCode?: string
  /** Official workflow component */
  readonly isOfficial?: boolean
  /** Icon identifier */
  readonly icon?: string
  /** Frozen state */
  readonly isFrozen?: boolean
  /** Output types this component produces */
  readonly outputTypes?: readonly string[]
  /** Editable state */
  readonly isEdited?: boolean
  /** Pinned state */
  readonly isPinned?: boolean
  /** Tool mode enabled */
  readonly isToolMode?: boolean
  /** Conditional paths configuration */
  readonly conditionalPaths?: readonly string[]
}

/**
 * Step data wrapper - contains the step configuration.
 * Note: The `node` property name is kept for React Flow JSON compatibility.
 */
export type StepDataWrapper = {
  /** Step ID (duplicated from parent) */
  readonly id: string
  /** Core node configuration (accessed via `node` for React Flow compatibility) */
  readonly node: NodeConfig
  /** Node type identifier */
  readonly type?: string
  /** Tooltip description */
  readonly description?: string
  /** Whether node is in loading state */
  readonly isLoading?: boolean
  /** Error state */
  readonly error?: unknown
  /** Build status */
  readonly buildStatus?: "success" | "error" | "building" | "idle"
}

/**
 * Node type enumeration (React Flow visual node types).
 */
export type NodeType = "genericNode" | "noteNode"

/**
 * Step data - represents a single step in the workflow.
 */
export type StepData = {
  /** Unique step identifier */
  readonly id: string
  /** React Flow node type */
  readonly type: NodeType
  /** Position on canvas */
  readonly position: Position
  /** Absolute position (after parent transforms) */
  readonly positionAbsolute?: Position
  /** Step data and configuration */
  readonly data: StepDataWrapper
  /** Step width in pixels */
  readonly width?: number
  /** Step height in pixels */
  readonly height?: number
  /** Whether step is selected */
  readonly isSelected?: boolean
  /** Whether step is being dragged */
  readonly isDragging?: boolean
  /** Parent step ID (for nested steps) */
  readonly parentId?: string
  /** Z-index for layering */
  readonly zIndex?: number
  /** Extent constraint */
  readonly extent?: "parent" | unknown
  /** Expandable parent */
  readonly shouldExpandParent?: boolean
}

/**
 * Connection data wrapper - contains connection port data.
 */
export type ConnectionDataWrapper = {
  /** Source port information */
  readonly sourceHandle: OutputPortData
  /** Target port information */
  readonly targetHandle: InputPortData
}

/**
 * Connection data - represents a connection between steps.
 */
export type ConnectionData = {
  /** Unique connection identifier */
  readonly id: string
  /** Source step ID */
  readonly source: string
  /** Target step ID */
  readonly target: string
  /** Source port ID (stringified OutputPortData) */
  readonly sourceHandle: string
  /** Target port ID (stringified InputPortData) */
  readonly targetHandle: string
  /** Connection data containing port information */
  readonly data: ConnectionDataWrapper
  /** Whether edge is animated */
  readonly isAnimated?: boolean
  /** Whether edge is selected */
  readonly isSelected?: boolean
  /** Edge type for rendering */
  readonly type?: string
  /** CSS class name */
  readonly className?: string
  /** Edge style */
  readonly style?: Readonly<Record<string, unknown>>
  /** Label configuration */
  readonly label?: string
  /** Label style */
  readonly labelStyle?: Readonly<Record<string, unknown>>
  /** Label background */
  readonly labelBgStyle?: Readonly<Record<string, unknown>>
  /** Label padding */
  readonly labelBgPadding?: readonly [number, number]
  /** Label border radius */
  readonly labelBgBorderRadius?: number
  /** Whether label should show background */
  readonly shouldShowLabelBg?: boolean
  /** Z-index for layering */
  readonly zIndex?: number
  /** Marker at start */
  readonly markerStart?: string
  /** Marker at end */
  readonly markerEnd?: string
  /** Connection interaction width */
  readonly interactionWidth?: number
}

/**
 * Workflow data - the complete workflow definition.
 */
export type WorkflowData = {
  /** All steps in the workflow */
  readonly nodes: readonly StepData[]
  /** All connections between steps */
  readonly edges: readonly ConnectionData[]
  /** Viewport state for the canvas */
  readonly viewport?: ViewPort
}

/**
 * Workflow dump - extended workflow data with metadata.
 */
export type WorkflowDump = {
  /** The workflow data */
  readonly data: WorkflowData
  /** Whether this is a reusable component */
  readonly isComponent?: boolean
  /** Workflow name */
  readonly name?: string
  /** Workflow description */
  readonly description?: string
  /** Endpoint name for API access */
  readonly endpointName?: string
}

/**
 * Step types in the workflow (business logic types).
 */
export type StepType =
  | "ConditionalRouter"
  | "Loop"
  | "SubFlow"
  | "Agent"
  | "Prompt"
  | "Command"
  | "Input"
  | "Output"
  | "HumanInput"
  | "Approval"
  | "Generic"

/**
 * Operators for conditional routing.
 */
export type ConditionalOperator =
  | "equals"
  | "not equals"
  | "contains"
  | "not contains"
  | "starts with"
  | "ends with"
  | "regex"
  | "less than"
  | "less than or equal"
  | "greater than"
  | "greater than or equal"

/**
 * Configuration for ConditionalRouter component.
 */
export type ConditionalRouterConfig = {
  /** The operator to use for comparison */
  readonly operator: ConditionalOperator
  /** Whether comparison is case-sensitive */
  readonly caseSensitive: boolean
  /** Maximum iterations to prevent infinite loops */
  readonly maxIterations: number
  /** Message/value for true branch */
  readonly trueCaseMessage?: unknown
  /** Message/value for false branch */
  readonly falseCaseMessage?: unknown
}

/**
 * Configuration for Loop component.
 */
export type LoopConfig = {
  /** Maximum iterations allowed */
  readonly maxIterations: number
  /** Whether to aggregate results */
  readonly aggregateResults: boolean
  /** Output type for aggregated results */
  readonly aggregateType?: "array" | "object" | "string"
}

/**
 * Configuration for SubFlow component.
 */
export type SubFlowConfig = {
  /** Name of the flow to invoke */
  readonly flowName?: string
  /** ID of the flow to invoke */
  readonly flowId?: string
  /** Tweaks to apply to the sub-flow */
  readonly tweaks?: Readonly<Record<string, unknown>>
  /** Whether to run synchronously */
  readonly synchronous: boolean
}

/**
 * Configuration for Agent component.
 */
export type AgentConfig = {
  /** OpenCode agent type to use (default: "build") */
  readonly agentType: string
  /** Model in "provider/model" format, e.g. "anthropic/claude-sonnet-4-20250514" */
  readonly model?: string
  /** Additional system prompt (augments agent's base prompt) */
  readonly systemPrompt?: string
  /** Tool overrides - true to enable, false to disable */
  readonly tools?: Readonly<Record<string, boolean>>
  /** Step timeout in milliseconds (overrides workflow default) */
  readonly timeoutMs?: number
  /** Max retry attempts for this step (overrides workflow default) */
  readonly maxRetries?: number
}

/**
 * Consistent output schema returned by all step executors.
 * Enables predictable downstream consumption via {{stepId.field}} interpolation.
 */
export type StepOutput = {
  /** Whether the step completed successfully */
  readonly success: boolean
  /** Human-readable summary of what was done (e.g., "Created 3 files") */
  readonly summary: string
  /** File paths created or modified by this step */
  readonly artifacts: readonly string[]
  /** Full agent text response (for downstream interpolation) */
  readonly response: string
}

/**
 * Default configuration values for all steps in a workflow.
 * Individual steps can override these values.
 */
export type WorkflowDefaults = {
  /** Default timeout for all steps (default: 300000ms = 5 minutes) */
  readonly timeoutMs: number
  /** Default max retries for all steps (default: 3) */
  readonly maxRetries: number
  /** Default model for all steps (optional) */
  readonly model?: string
}

/** Default workflow configuration values */
export const DEFAULT_WORKFLOW_DEFAULTS: WorkflowDefaults = {
  timeoutMs: 300000, // 5 minutes
  maxRetries: 3,
}

/**
 * Configuration for Prompt component.
 */
export type PromptConfig = {
  /** The prompt template */
  readonly template: string
  /** Variables to inject into template */
  readonly variables?: Readonly<Record<string, unknown>>
}

/**
 * Configuration for Command component.
 * Executes standalone commands/scripts (shell scripts, API calls, external commands).
 */
export type CommandConfig = {
  /** Command identifier */
  readonly commandId: string
  /** Command name */
  readonly name: string
  /** Command description */
  readonly description?: string
  /** Command parameters schema */
  readonly parameters?: Readonly<Record<string, unknown>>
}

/**
 * Configuration for Input component.
 */
export type InputConfig = {
  /** Input type (text, file, etc.) */
  readonly inputType: string
  /** Whether input is required */
  readonly required: boolean
  /** Default value */
  readonly defaultValue?: unknown
  /** Validation schema */
  readonly validation?: Readonly<Record<string, unknown>>
}

/**
 * Configuration for Output component.
 */
export type OutputConfig = {
  /** Output type (text, file, etc.) */
  readonly outputType: string
  /** Output format */
  readonly format?: string
  /** Whether to display output */
  readonly display: boolean
}

/**
 * Union type for all step configurations.
 */
export type StepConfig =
  | { type: "ConditionalRouter"; config: ConditionalRouterConfig }
  | { type: "Loop"; config: LoopConfig }
  | { type: "SubFlow"; config: SubFlowConfig }
  | { type: "Agent"; config: AgentConfig }
  | { type: "Prompt"; config: PromptConfig }
  | { type: "Command"; config: CommandConfig }
  | { type: "Input"; config: InputConfig }
  | { type: "Output"; config: OutputConfig }
  | { type: "Generic"; config: Record<string, unknown> }

/**
 * Parsed step representation.
 */
export type ParsedStep = {
  /** Unique step identifier */
  readonly id: string
  /** Step type */
  readonly type: StepType
  /** Input values */
  readonly inputs: Readonly<Record<string, unknown>>
  /** Output names */
  readonly outputs: readonly string[]
  /** Position on canvas */
  readonly position: Readonly<{ x: number; y: number }>
  /** Step-specific configuration */
  readonly config: StepConfig
  /** Display name */
  readonly displayName: string
  /** Step description */
  readonly description?: string
}

/**
 * Parsed connection representation.
 */
export type ParsedConnection = {
  /** Unique connection identifier */
  readonly id: string
  /** Source step ID */
  readonly source: string
  /** Target step ID */
  readonly target: string
  /** Source output name */
  readonly sourceOutput: string
  /** Target input name */
  readonly targetInput: string
}

/**
 * Result of parsing a workflow.
 */
export type ParsedWorkflow = {
  /** Steps in execution order (topologically sorted) */
  readonly executionOrder: readonly string[]
  /** Step definitions by ID */
  readonly nodes: ReadonlyMap<string, ParsedStep>
  /** Connection definitions by ID */
  readonly edges: ReadonlyMap<string, ParsedConnection>
  /** Adjacency list: stepId → successor stepIds */
  readonly adjacency: ReadonlyMap<string, readonly string[]>
  /** Reverse adjacency: stepId → predecessor stepIds */
  readonly reverseAdjacency: ReadonlyMap<string, readonly string[]>
  /** Entry points (steps with no predecessors) */
  readonly entryPoints: readonly string[]
  /** Exit points (steps with no successors) */
  readonly exitPoints: readonly string[]
}

/**
 * Result of evaluating a conditional.
 */
export type ConditionalResult = {
  /** Which branch was taken */
  readonly branch: "true" | "false"
  /** The value to pass to the next node */
  readonly result: unknown
}

/**
 * Output from a loop iteration.
 */
export type LoopOutput = {
  /** Type of output */
  readonly type: "item" | "done"
  /** Current item or aggregated result */
  readonly value: unknown
  /** Current iteration index */
  readonly index: number
  /** Whether loop is complete */
  readonly isComplete: boolean
}

/**
 * Output from a sub-flow execution.
 */
export type SubFlowOutput = {
  /** All outputs from the sub-flow */
  readonly outputs: Readonly<Record<string, unknown>>
  /** Whether execution was successful */
  readonly success: boolean
  /** Error message if failed */
  readonly error?: string
}

/**
 * How the workflow terminated.
 */
export type WorkflowTerminateMode = "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT"

/**
 * Validation error with details.
 */
export type ValidationError = {
  /** Error code for programmatic handling */
  readonly code: string
  /** Human-readable error message */
  readonly message: string
  /** Path to the problematic field */
  readonly path?: readonly string[]
  /** Suggested fix */
  readonly suggestion?: string
}

/**
 * Validation warning (non-blocking).
 */
export type ValidationWarning = {
  /** Warning code */
  readonly code: string
  /** Human-readable warning message */
  readonly message: string
  /** Path to the field in question */
  readonly path?: readonly string[]
}

/**
 * Result of validating a workflow.
 */
export type ValidationResult = {
  /** Whether the workflow is valid */
  readonly valid: boolean
  /** Validation errors (blocking) */
  readonly errors: readonly ValidationError[]
  /** Validation warnings (non-blocking) */
  readonly warnings: readonly ValidationWarning[]
}

/**
 * Status of a step execution.
 */
export type StepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED" | "WAITING_APPROVAL"

/**
 * Result of executing a single step.
 */
export type StepResult = {
  /** Step ID */
  readonly stepId: string
  /** Step display name */
  readonly displayName: string
  /** Execution status */
  readonly status: StepStatus
  /** Step outputs */
  readonly outputs: Readonly<Record<string, unknown>>
  /** Session ID for UI interaction (for Agent steps) */
  readonly sessionID?: string
  /** Error if failed */
  readonly error?: string
  /** Stack trace if available */
  readonly stackTrace?: string
  /** Start timestamp */
  readonly startTime: number
  /** End timestamp */
  readonly endTime?: number
  /** Duration in milliseconds */
  readonly duration?: number
  /** Retry count */
  readonly retryCount: number
}

/**
 * Result of executing a workflow.
 */
export type WorkflowResult = {
  /** Unique execution identifier */
  readonly executionId: string
  /** Parent session ID for all steps */
  readonly workflowSessionID?: string
  /** How the workflow terminated */
  readonly terminateMode: WorkflowTerminateMode
  /** All workflow outputs */
  readonly outputs: Readonly<Record<string, unknown>>
  /** Total duration in milliseconds */
  readonly duration: number
  /** Results of each step */
  readonly stepResults: readonly StepResult[]
  /** Final error if failed */
  readonly error?: string
  /** Timestamp when execution started */
  readonly startTime: number
  /** Timestamp when execution ended */
  readonly endTime: number
}

/**
 * Options for executing a workflow.
 */
export type ExecutionOptions = {
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal
  /** Resume from a specific node */
  readonly resumeFrom?: string
  /** Previous outputs to use */
  readonly previousOutputs?: Readonly<Record<string, unknown>>
  /** Maximum execution time in milliseconds */
  readonly timeout?: number
  /** Whether to run in dry-run mode */
  readonly dryRun?: boolean
  /** Custom variables to inject */
  readonly variables?: Readonly<Record<string, unknown>>
  /** Override default approval behavior */
  readonly autoApprove?: boolean
  /** Pre-generated execution ID (for state manager synchronization) */
  readonly executionId?: string
}

/**
 * Snapshot for crash recovery.
 */
export type ExecutionSnapshot = {
  /** Execution ID */
  readonly executionId: string
  /** Task ID (Linear/Jira task) */
  readonly taskId: string
  /** Current state of the machine */
  readonly machineState: unknown
  /** Accumulated outputs */
  readonly outputs: Readonly<Record<string, unknown>>
  /** Step results so far */
  readonly stepResults: readonly StepResult[]
  /** When snapshot was taken */
  readonly timestamp: number
  /** Version for compatibility */
  readonly version: string
}

/**
 * Event emitted during workflow execution.
 */
export type WorkflowEvent =
  | { type: "WORKFLOW_STARTED"; executionId: string; taskId: string }
  | {
      type: "WORKFLOW_COMPLETED"
      executionId: string
      outputs: Record<string, unknown>
    }
  | { type: "WORKFLOW_FAILED"; executionId: string; error: string }
  | { type: "WORKFLOW_CANCELLED"; executionId: string }
  | {
      type: "STEP_STARTED"
      executionId: string
      stepId: string
      displayName: string
    }
  | {
      type: "STEP_COMPLETED"
      executionId: string
      stepId: string
      outputs: Record<string, unknown>
    }
  | { type: "STEP_FAILED"; executionId: string; stepId: string; error: string }
  | {
      type: "STEP_SKIPPED"
      executionId: string
      stepId: string
      reason: string
    }
  | {
      type: "STEP_PROGRESS"
      executionId: string
      stepId: string
      content: string
    }
  | {
      type: "STEP_SESSION_CREATED"
      executionId: string
      stepId: string
      sessionID: string
      agentName: string
    }
  | {
      type: "TOOL_CALL_STARTED"
      executionId: string
      stepId: string
      toolCall: {
        id: string
        name: string
        args: Record<string, unknown>
      }
    }
  | {
      type: "TOOL_CALL_COMPLETED"
      executionId: string
      stepId: string
      toolCall: {
        id: string
        name: string
        args: Record<string, unknown>
        result: unknown
        success: boolean
      }
    }
  | {
      type: "CONTEXT_UPDATED"
      executionId: string
      stepId: string
      context: Record<string, unknown>
    }
  | {
      type: "APPROVAL_REQUIRED"
      executionId: string
      stepId: string
      data: unknown
    }
  | {
      type: "APPROVAL_RECEIVED"
      executionId: string
      stepId: string
      decision: string
    }

/**
 * Listener for workflow events.
 */
export type WorkflowEventListener = (event: WorkflowEvent) => void

/**
 * Subscription handle for event listeners.
 */
export type Subscription = {
  /** Unsubscribe from events */
  readonly unsubscribe: () => void
}

/**
 * Loop state for a specific loop step.
 */
export type LoopState = {
  /** Loop step ID */
  readonly stepId: string
  /** Data being iterated */
  readonly data: readonly unknown[]
  /** Current index */
  readonly index: number
  /** Aggregated results */
  readonly aggregated: readonly unknown[]
  /** Whether loop is initialized */
  readonly initialized: boolean
}

/**
 * Context for the workflow machine.
 */
export type WorkflowContext = {
  /** Parsed workflow structure */
  readonly graph: ParsedWorkflow | null
  /** Task ID for this execution (Linear/Jira task) */
  readonly taskId: string
  /** Unique execution ID */
  readonly executionId: string
  /** Parent session ID for the workflow (agent steps create child sessions) */
  readonly workflowSessionID?: string
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal
  /** Accumulated outputs from all steps */
  readonly outputs: Readonly<Record<string, Record<string, unknown>>>
  /** Steps waiting to be processed */
  readonly pendingSteps: readonly string[]
  /** Currently executing step ID */
  readonly currentStep: string | null
  /** Currently executing step */
  readonly currentStepData: ParsedStep | null
  /** Results of completed steps */
  readonly stepResults: readonly StepResult[]
  /** Loop states by step ID */
  readonly loopStates: ReadonlyMap<string, LoopState>
  /** When execution started */
  readonly startTime: number
  /** Last error encountered */
  readonly error: string | null
  /** Error stack trace */
  readonly errorStack: string | null
  /** Variables for interpolation */
  readonly variables: Readonly<Record<string, unknown>>
  /** Retry count for current step */
  readonly retryCount: number
  /** Maximum retries allowed */
  readonly maxRetries: number
  /** Whether in dry-run mode */
  readonly dryRun: boolean
  /** Steps that have been completed */
  readonly completedSteps: ReadonlySet<string>
  /** Steps that have been skipped */
  readonly skippedSteps: ReadonlySet<string>
  /** Step executor registry for pluggable execution */
  readonly executorRegistry?: unknown // Typed as unknown to avoid circular dependency
}

/**
 * Events that can be sent to the workflow machine.
 */
export type WorkflowMachineEvent =
  | {
      type: "START"
      graph: ParsedWorkflow
      taskId: string
      variables?: Record<string, unknown>
      executionId?: string
    }
  | { type: "STEP_COMPLETED"; stepId: string; outputs: Record<string, unknown> }
  | { type: "STEP_FAILED"; stepId: string; error: string; stack?: string }
  | { type: "STEP_SKIPPED"; stepId: string; reason: string }
  | {
      type: "CONDITIONAL_RESULT"
      stepId: string
      branch: "true" | "false"
      result: unknown
    }
  | { type: "LOOP_NEXT"; stepId: string }
  | { type: "LOOP_COMPLETE"; stepId: string; aggregated: unknown[] }
  | {
      type: "SUBFLOW_COMPLETE"
      stepId: string
      outputs: Record<string, unknown>
    }
  | { type: "PAUSE" }
  | { type: "APPROVE" }
  | { type: "REJECT"; reason?: string }
  | { type: "REFINE"; feedback: string }
  | { type: "ABORT" }
  | { type: "RETRY" }
  | { type: "TIMEOUT" }

/**
 * Event emitted during step execution for streaming updates.
 */
export type StepExecutionEvent =
  | { type: "progress"; stepId: string; content: string }
  | { type: "tool_start"; stepId: string; toolName: string; toolArgs: unknown }
  | { type: "tool_end"; stepId: string; toolName: string; toolResult: unknown }
  | { type: "session_created"; stepId: string; sessionId: string; agentName: string }

/**
 * Callback for emitting step execution events.
 */
export type StepEventEmitter = (event: StepExecutionEvent) => void

/**
 * Input for the execute step actor.
 */
export type ExecuteStepInput = {
  /** Step to execute */
  readonly step: ParsedStep
  /** Execution ID for looking up step event emitter */
  readonly executionId: string
  /** Parent session ID for the workflow (agent steps create child sessions) */
  readonly workflowSessionID?: string
  /** Outputs from previous steps */
  readonly outputs: Readonly<Record<string, Record<string, unknown>>>
  /** Variables for interpolation */
  readonly variables: Readonly<Record<string, unknown>>
  /** Whether in dry-run mode */
  readonly dryRun: boolean
  /** Loop states for loop steps */
  readonly loopStates: ReadonlyMap<string, LoopState>
  /** Step executor registry for pluggable execution */
  readonly executorRegistry?: unknown // Typed as unknown to avoid circular dependency
  /** Abort signal for cancellation propagation */
  readonly signal?: AbortSignal
}

/**
 * Output from the execute step actor.
 */
export type ExecuteStepOutput = {
  /** Step ID */
  readonly stepId: string
  /** Session ID created by this step (for Agent steps) */
  readonly sessionID?: string
  /** Step outputs */
  readonly outputs: Readonly<Record<string, unknown>>
  /** Updated loop state (if loop step) */
  readonly loopState?: LoopState
  /** Branch taken (if conditional step) */
  readonly branch?: "true" | "false"
  /** Whether step is complete */
  readonly complete: boolean
  /** Steps to skip (for conditional routing) */
  readonly skipSteps?: readonly string[]
}

/**
 * State value for the workflow machine.
 */
export type WorkflowStateValue =
  | "idle"
  | "preparing"
  | { executing: "pickNext" | "runStep" | "processResult" | "handleError" }
  | "awaitingApproval"
  | "completed"
  | "failed"
  | "cancelled"

/**
 * Actor input for spawning the workflow machine.
 */
export type WorkflowActorInput = {
  /** Parsed workflow to execute */
  readonly graph: ParsedWorkflow
  /** Task ID */
  readonly taskId: string
  /** Parent session ID for the workflow (agent steps create child sessions) */
  readonly workflowSessionID?: string
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal
  /** Initial outputs */
  readonly outputs?: Readonly<Record<string, Record<string, unknown>>>
  /** Starting node (for resume) */
  readonly startFromNode?: string
  /** Variables for interpolation */
  readonly variables?: Readonly<Record<string, unknown>>
  /** Whether in dry-run mode */
  readonly dryRun?: boolean
  /** Maximum retries per node */
  readonly maxRetries?: number
  /** Step executor registry for pluggable execution */
  readonly executorRegistry?: unknown // Typed as unknown to avoid circular dependency
}

/**
 * Type guard to check if a value is a WorkflowMachineEvent.
 */
export function isWorkflowEvent(value: unknown): value is WorkflowMachineEvent {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const event = value as Record<string, unknown>
  return typeof event["type"] === "string"
}

/**
 * Initial context factory.
 */
export function createInitialContext(input?: Partial<WorkflowActorInput>): WorkflowContext {
  return {
    graph: null,
    taskId: input?.taskId ?? "",
    executionId: "",
    workflowSessionID: input?.workflowSessionID,
    outputs: input?.outputs ?? {},
    pendingSteps: [],
    currentStep: null,
    currentStepData: null,
    stepResults: [],
    loopStates: new Map(),
    startTime: Date.now(),
    error: null,
    errorStack: null,
    variables: input?.variables ?? {},
    retryCount: 0,
    maxRetries: input?.maxRetries ?? 3,
    dryRun: input?.dryRun ?? false,
    completedSteps: new Set(),
    skippedSteps: new Set(),
    executorRegistry: input?.executorRegistry,
  }
}

/**
 * Error shape for CycleDetectedError.
 */
export type CycleDetectedErrorShape = Error & {
  readonly name: "CycleDetectedError"
  readonly cycle: readonly string[]
}

/**
 * Type guard to check if an error is a CycleDetectedError.
 */
export function isCycleDetectedError(error: unknown): error is CycleDetectedErrorShape {
  return (
    error instanceof Error &&
    error.name === "CycleDetectedError" &&
    "cycle" in error &&
    Array.isArray((error as CycleDetectedErrorShape).cycle)
  )
}

/**
 * Error shape for WorkflowParseError.
 */
export type WorkflowParseErrorShape = Error & {
  readonly name: "WorkflowParseError"
  readonly details?: Readonly<Record<string, unknown>>
}

/**
 * Type guard to check if an error is a WorkflowParseError.
 */
export function isWorkflowParseError(error: unknown): error is WorkflowParseErrorShape {
  return error instanceof Error && error.name === "WorkflowParseError"
}

/**
 * Error shape for StepExecutionError.
 */
export type StepExecutionErrorShape = Error & {
  readonly name: "StepExecutionError"
  readonly stepId: string
  readonly originalCause?: Error
}

/**
 * Type guard to check if an error is a StepExecutionError.
 */
export function isStepExecutionError(error: unknown): error is StepExecutionErrorShape {
  return (
    error instanceof Error &&
    error.name === "StepExecutionError" &&
    "stepId" in error &&
    typeof (error as StepExecutionErrorShape).stepId === "string"
  )
}

/**
 * Error shape for SubFlowExecutionError.
 */
export type SubFlowExecutionErrorShape = Error & {
  readonly name: "SubFlowExecutionError"
  readonly flowId?: string
  readonly flowName?: string
  readonly originalCause?: Error
}

/**
 * Type guard to check if an error is a SubFlowExecutionError.
 */
export function isSubFlowExecutionError(error: unknown): error is SubFlowExecutionErrorShape {
  return error instanceof Error && error.name === "SubFlowExecutionError"
}

/**
 * Type guard to check if an error is any orchestrator error.
 */
export function isOrchestratorError(error: unknown): error is Error {
  return (
    isCycleDetectedError(error) ||
    isWorkflowParseError(error) ||
    isStepExecutionError(error) ||
    isSubFlowExecutionError(error)
  )
}

/**
 * Gets a human-readable error message from an unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return String(error)
}

/**
 * Input variable for template interpolation.
 * Used for small, specific values injected inline via {{name}}.
 */
export type StepInput = {
  /** Variable name used in template: {{name}} */
  readonly name: string
  /** Source path: "stepId.outputKey" or "external.key" */
  readonly source: string
  /** Whether this input is required for step execution */
  readonly required: boolean
}

/**
 * Context block for appending large reference material.
 * Appended as XML: <name>content</name>
 */
export type StepContext = {
  /** XML tag name: <name>...</name> */
  readonly name: string
  /** Source: "stepId.outputKey", file path, or literal string */
  readonly source: string
  /** Source type */
  readonly type: "output" | "file" | "static"
  /**
   * For file type only:
   * - 'path': Include path reference (agent reads via tools)
   * - 'contents': Embed file contents in prompt
   * @default 'path'
   */
  readonly mode?: "path" | "contents"
}

/**
 * Configuration for building a prompt with hybrid context.
 * Used by Agent steps.
 */
export type PromptBuildConfig = {
  /** Template with {{variable}} placeholders */
  readonly template: string
  /** Inputs for interpolation (small values) */
  readonly inputs?: readonly StepInput[]
  /** Context blocks for appending (large reference material) */
  readonly context?: readonly StepContext[]
}
