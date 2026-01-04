/**
 * State Manager Defaults
 *
 * Default values and constants for the State Manager.
 */

/** FloMaster directory */
export const FLOMASTER_DIR = ".flomaster"

/** Executions directory (relative to target dir) */
export const EXECUTIONS_DIR = "executions"

/** State file name within execution directory */
export const STATE_FILENAME = "state.json"

/** Context file name within execution directory */
export const CONTEXT_FILENAME = "context.json"

/** Mapping file name within execution directory */
export const MAPPING_FILENAME = "mapping.json"

/** Checkpoint file name within execution directory */
export const CHECKPOINT_FILENAME = "checkpoint.json"

/** Default: checkpoint after each step completion */
export const DEFAULT_CHECKPOINT_ON_STEP_COMPLETE = true

/** Current checkpoint schema version */
export const CHECKPOINT_VERSION = "1.0"

/** Default limit for listExecutions */
export const DEFAULT_LIST_LIMIT = 100

/** Maximum limit for listExecutions */
export const MAX_LIST_LIMIT = 1000
