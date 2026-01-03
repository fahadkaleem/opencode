# Documentation Standards

Reference: `design/09-coding-standards/standards-reference/08-documentation.md`

<documentation_rules>

## JSDoc for Public APIs

Document exported symbols so consumers understand usage without reading implementation.

- **Exported Functions**: Every exported function needs JSDoc with description, `@param` for each parameter (with descriptions), and `@returns` describing the return value. This enables IDE tooltips and API documentation generation.

  ```typescript
  // ✓ Good
  /**
   * Loads workflow configuration from the specified path.
   * @param configPath - Absolute path to the workflow JSON file
   * @param options - Loading options including validation settings
   * @returns The parsed workflow configuration
   */
  export function loadWorkflow(configPath: string, options: LoadOptions): WorkflowConfig;

  // ✗ Bad - missing descriptions
  /**
   * @param configPath
   * @param options
   * @returns
   */
  export function loadWorkflow(configPath: string, options: LoadOptions): WorkflowConfig;
  ```

- **Async Functions**: For exported async functions, `@returns` describes what the promise resolves to using "A promise that resolves to…" so callers know the resolved value type.

  ```typescript
  /**
   * Fetches user profile from the API.
   * @param userId - The user's unique identifier
   * @returns A promise that resolves to the user profile, or null if not found
   */
  export async function fetchUserProfile(userId: string): Promise<UserProfile | null>;
  ```

- **Exported Classes**: Classes need JSDoc describing responsibility and key dependencies. This helps consumers understand when to use the class and what it depends on.

  ```typescript
  /**
   * Manages workflow execution state and coordinates phase transitions.
   * Uses XState for state machine management and emits events via MessageBus.
   */
  export class WorkflowEngine { ... }
  ```

- **Exported Interfaces**: Interfaces need JSDoc describing purpose. Document individual properties only when meaning isn't obvious from the name, to avoid redundant noise.

  ```typescript
  /**
   * Configuration for a single workflow phase.
   */
  export interface PhaseConfig {
    /** Phase identifier, must be unique within the workflow */
    id: string;
    /** Commands to execute in this phase */
    commands: CommandConfig[];
    /** Maximum execution time before timeout */
    timeoutMs?: number; // Name is self-explanatory, no comment needed
  }
  ```

- **Exported Enums**: Enums need JSDoc on the enum itself. Add member JSDoc only when member meaning isn't self-explanatory.

  ```typescript
  /**
   * Possible states for a workflow execution.
   */
  export enum WorkflowState {
    Pending,
    Running,
    /** Paused by user or waiting for approval */
    Paused,
    Completed,
    Failed,
  }
  ```

- **Exported Type Aliases**: Type aliases need JSDoc describing their purpose, especially for complex unions or generics.
  ```typescript
  /**
   * Result of a command execution, either successful output or an error.
   */
  export type CommandResult = CommandSuccess | CommandFailure;
  ```

## TypeScript Types in JSDoc

Let TypeScript handle types. JSDoc should add semantic meaning, not duplicate type information that's already in the signature.

- **Omit JSDoc type annotations**: TypeScript provides types; adding `{string}` or `{number}` in JSDoc is redundant and can drift out of sync.

  ```typescript
  // ✓ Good - TypeScript has the type, JSDoc adds meaning
  /**
   * @param userId - The user's unique identifier
   */
  function getUser(userId: string): User;

  // ✗ Bad - redundant type annotation
  /**
   * @param {string} userId - The user's unique identifier
   */
  function getUser(userId: string): User;
  ```

## Comments That Add Value

Comments should explain WHY, not WHAT. Code shows what happens; comments explain non-obvious reasoning.

- **High-Value Comments**: Explain constraints, trade-offs, workarounds, or non-obvious behavior.

  ```typescript
  // ✓ Good - explains WHY
  // Rate limit to 10 req/s to stay within API tier limits
  const RATE_LIMIT_MS = 100;

  // Intentionally not using Promise.all - sequential execution required
  // for proper state machine transitions
  for (const phase of phases) {
    await executePhase(phase);
  }

  // ✗ Bad - restates WHAT the code does
  // Loop through phases
  for (const phase of phases) {
    await executePhase(phase);
  }
  ```

- **Comment Style**: Use single-line `//` for inline comments, not block `/* */`. Single-line is easier to toggle and doesn't nest poorly.

- **Self-Documenting Patterns Need No Comments**: These patterns are clear from the code:
  - Simple getters/setters
  - Obvious control flow (`if (isValid) return;`)
  - Standard async/await patterns
  - Import statements
  - Clear type declarations
  - Constructor property assignments

- **Keep Code Clean**: Remove noise that adds no value:
  - Empty JSDoc blocks (delete them)
  - Commented-out code (use git history instead)
  - Changelog comments in code (use git commits)

## TODO and Annotation Comments

- **TODO Format**: Use `TODO(owner): description` or `TODO(#issue): description` (or both) so TODOs are actionable and trackable. Orphaned TODOs without owner or issue get lost.

  ```typescript
  // ✓ Good - trackable
  // TODO(alice): Implement retry logic for transient failures
  // TODO(#123): Add support for parallel phase execution
  // TODO(bob, #456): Refactor to use new MessageBus API

  // ✗ Bad - orphaned, no accountability
  // TODO: fix this later
  // TODO - improve performance
  ```

- **Annotation Types**: Use appropriate annotations to signal intent:
  - `TODO`: Planned improvement or missing feature
  - `FIXME`: Known bug or problematic code needing fix
  - `HACK`: Temporary workaround, document why and when to remove
  - `NOTE`: Important context for future readers

## Optional Documentation

- **Module Description**: Complex modules with non-obvious purpose benefit from `@fileoverview` at the top (before imports) to orient readers.

  ```typescript
  /**
   * @fileoverview Workflow state machine implementation using XState v5.
   * Handles phase transitions, error recovery, and checkpoint persistence.
   */
  import { createMachine } from 'xstate';
  ```

- **Error Documentation**: Functions that throw should document error types with `@throws` so callers know what to catch.

  ```typescript
  /**
   * Parses workflow definition from JSON string.
   * @param json - Raw JSON string
   * @returns Parsed workflow definition
   * @throws {SyntaxError} If JSON is malformed
   * @throws {ValidationError} If workflow schema is invalid
   */
  export function parseWorkflow(json: string): WorkflowDefinition;
  ```

- **Complex Types with Examples**: Complex type aliases (especially recursive or union types) benefit from `@example` blocks showing usage.

  ```typescript
  /**
   * Recursive tree structure for nested workflow phases.
   * @example
   * const phase: PhaseTree = {
   *   id: 'root',
   *   children: [
   *     { id: 'child1', children: [] },
   *     { id: 'child2', children: [] }
   *   ]
   * };
   */
  export type PhaseTree = {
    id: string;
    children: PhaseTree[];
  };
  ```

- **Private Functions**: Private/non-exported functions may omit JSDoc when name and signature are self-explanatory. Add brief comments only for non-obvious logic.

</documentation_rules>

## Exceptions

- **Generated code**: May skip normal documentation rules. Document that it's generated and reference the source spec.
- **Test files**: May skip JSDoc where tests are self-documenting (test names describe behavior).
- **`.d.ts` files**: May differ when types come from external sources. Include a source reference.

## Enforcement

Configure ESLint with:

- `eslint-plugin-jsdoc` for JSDoc completeness on exports
- `no-warning-comments` for TODO/FIXME format validation

## Verification Checklist

When reviewing code for documentation compliance:

- [ ] All exported functions have JSDoc with description, `@param`, and `@returns`
- [ ] Async function `@returns` uses "A promise that resolves to…"
- [ ] Exported classes have JSDoc describing responsibility
- [ ] Exported interfaces have JSDoc describing purpose
- [ ] Exported enums have JSDoc on the enum
- [ ] Exported type aliases have JSDoc describing purpose
- [ ] No JSDoc type annotations like `{string}` (let TypeScript handle types)
- [ ] Comments explain WHY, not WHAT
- [ ] No empty JSDoc blocks
- [ ] No commented-out code
- [ ] No changelog comments in code
- [ ] All TODOs have owner and/or issue number: `TODO(owner):` or `TODO(#issue):`
- [ ] Single-line `//` used for inline comments (not block `/* */`)
- [ ] Self-documenting code has no redundant comments
