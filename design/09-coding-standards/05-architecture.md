# Architecture Patterns

Reference: `design/09-coding-standards/standards-reference/05-architecture.md`

<architecture_rules>

## Layered Architecture

Follow a 4-layer architecture where each layer has a specific responsibility. This separation enables independent testing, clear boundaries, and prevents coupling.

```
Presentation → Orchestration → Domain → Infrastructure
     ↓              ↓            ↓
   (UI/CLI)    (Workflows)   (Business)    (External I/O)
```

### Layer Responsibilities

| Layer              | Purpose                             | Examples                                     |
| ------------------ | ----------------------------------- | -------------------------------------------- |
| **Presentation**   | User interaction, commands, UI      | CLI commands, React components, API routes   |
| **Orchestration**  | Coordinate workflows, handle events | Workflow handlers, event handlers, executors |
| **Domain**         | Business logic, validation, state   | Services, managers, validators               |
| **Infrastructure** | External systems, I/O, persistence  | Clients, loaders, registries, file system    |

### Dependency Rules

Dependencies flow **downward only**. Upper layers can depend on lower layers, but never the reverse. This prevents changes in UI from breaking business logic and keeps infrastructure swappable.

**Allowed dependencies:**

```
Presentation  →  Orchestration  ✓
Presentation  →  Domain         ✓
Orchestration →  Domain         ✓
Orchestration →  Infrastructure ✓
Domain        →  Infrastructure ✓
```

**Forbidden dependencies** (these create coupling and circular dependency risks):

```
Presentation  →  Infrastructure  ✗  (skip layers = hidden coupling)
Orchestration →  Presentation    ✗  (upward = inverted control)
Domain        →  Orchestration   ✗  (upward = inverted control)
Domain        →  Presentation    ✗  (upward = inverted control)
Infrastructure → Any Layer       ✗  (infrastructure is the bottom)
```

- ✓ `WorkflowHandler` (Orchestration) imports `ConfigService` (Domain)
- ✗ `ConfigService` (Domain) imports `WorkflowHandler` (Orchestration)

## Component Roles

Use the correct role suffix and place components in the corresponding layer. Role suffixes communicate purpose instantly and enforce consistent patterns across the codebase.

| Role         | Layer          | Purpose                                           | State                |
| ------------ | -------------- | ------------------------------------------------- | -------------------- |
| `*Service`   | Domain         | Stateless business logic                          | Stateless            |
| `*Manager`   | Domain         | Lifecycle and state management                    | Mutable state        |
| `*Validator` | Domain         | Data validation against rules/schemas             | Stateless            |
| `*Resolver`  | Domain         | Resolve references/lookups (often via registries) | Stateless            |
| `*Handler`   | Orchestration  | Orchestrate workflows, events, requests           | Stateless            |
| `*Executor`  | Orchestration  | Execute commands and tasks                        | Stateless            |
| `*Registry`  | Infrastructure | Store/retrieve registered items                   | Immutable after init |
| `*Loader`    | Infrastructure | Load resources from external sources              | Stateless            |
| `*Client`    | Infrastructure | External system/API communication                 | Stateless            |
| `*Factory`   | Any            | Complex object creation                           | Stateless            |
| `*Builder`   | Any            | Step-by-step construction                         | Temporary            |

### Choosing the Right Role

- **Stateless business logic?** → `*Service`
- **Manages mutable state or lifecycle?** → `*Manager`
- **Coordinates multiple operations?** → `*Handler`
- **Executes a command/task?** → `*Executor`
- **Validates data?** → `*Validator`
- **Looks up/resolves references?** → `*Resolver`
- **Stores registered items for lookup?** → `*Registry`
- **Loads from external source?** → `*Loader`
- **Calls external API/system?** → `*Client`
- **Complex or async construction?** → `*Factory` or static `.create()`
- **Step-by-step building?** → `*Builder`

## Dependency Injection

Use constructor injection for all dependencies. This makes dependencies explicit, enables testing with mocks, and prevents hidden coupling through globals.

```typescript
// ✓ Correct: Dependencies are explicit and injectable
class WorkflowService {
  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly stateManager: StateManager
  ) {}
}

// ✗ Wrong: Hidden dependency on global
class WorkflowService {
  private configLoader = ConfigLoader.getInstance(); // Hidden, untestable
}
```

### Injection Patterns

| Scenario                        | Pattern                                 | Rationale                           |
| ------------------------------- | --------------------------------------- | ----------------------------------- |
| Long-lived service dependencies | Constructor injection                   | Dependencies are fixed for lifetime |
| Single operation dependencies   | Method parameter injection              | Dependency varies per call          |
| Configuration values (constant) | Constructor parameter                   | Fixed at creation                   |
| Configuration values (dynamic)  | Config object parameter                 | May change between calls            |
| Optional functionality          | Optional constructor param with default | Allows override for testing         |

## Registry Initialization

Registries hold items that must be registered before use (tools, providers, plugins). Guard against usage before initialization to catch configuration errors early.

```typescript
class ToolRegistry {
  private initialized = false;
  private tools = new Map<string, Tool>();

  // Explicit initialization method
  async initialize(config: ToolConfig): Promise<void> {
    // Register tools...
    this.initialized = true;
  }

  get(name: string): Tool {
    // Guard: fail fast if not initialized
    if (!this.initialized) {
      throw new Error('ToolRegistry not initialized. Call initialize() first.');
    }
    return this.tools.get(name);
  }
}
```

## Async Initialization

Use static factory methods for async initialization instead of async constructors. Constructors cannot be async in JavaScript, and workarounds (like calling `.then()` after `new`) are error-prone.

```typescript
// ✓ Correct: Static factory for async init
class DatabaseClient {
  private constructor(private connection: Connection) {}

  static async create(config: DbConfig): Promise<DatabaseClient> {
    const connection = await connect(config);
    return new DatabaseClient(connection);
  }
}

// Usage
const db = await DatabaseClient.create(config);

// ✗ Wrong: Async work in constructor
class DatabaseClient {
  constructor(config: DbConfig) {
    this.connect(config); // Promise ignored, race condition
  }
}
```

## Single Responsibility

Each component should have one reason to change. When a class handles multiple unrelated concerns, changes to one concern risk breaking others, and the class becomes harder to test.

```typescript
// ✗ Wrong: God class with mixed responsibilities
class WorkflowManager {
  loadWorkflow() {
    /* file I/O */
  }
  validateWorkflow() {
    /* validation logic */
  }
  executeWorkflow() {
    /* orchestration */
  }
  saveResults() {
    /* persistence */
  }
  notifyUser() {
    /* presentation */
  }
}

// ✓ Correct: Split by responsibility
class WorkflowLoader {
  /* Infrastructure: file I/O */
}
class WorkflowValidator {
  /* Domain: validation */
}
class WorkflowExecutor {
  /* Orchestration: execution */
}
class ResultsRepository {
  /* Infrastructure: persistence */
}
class NotificationService {
  /* Domain: notification logic */
}
```

## Domain Logic Placement

Keep business logic in the Domain layer (Services, Managers, Validators). Scattering domain logic across Orchestration or Presentation creates an "anemic domain model" where business rules are duplicated and hard to find.

```typescript
// ✗ Wrong: Business logic in handler (Orchestration)
class WorkflowHandler {
  async handle(workflow: Workflow) {
    // Business rule buried in orchestration
    if (workflow.phases.length > 10) {
      throw new Error('Too many phases');
    }
  }
}

// ✓ Correct: Business logic in validator (Domain)
class WorkflowValidator {
  validate(workflow: Workflow): ValidationResult {
    if (workflow.phases.length > 10) {
      return { valid: false, error: 'Maximum 10 phases allowed' };
    }
    return { valid: true };
  }
}

class WorkflowHandler {
  constructor(private validator: WorkflowValidator) {}

  async handle(workflow: Workflow) {
    const result = this.validator.validate(workflow);
    if (!result.valid) throw new ValidationError(result.error);
  }
}
```

## Composition Over Inheritance

Prefer composing components over deep inheritance hierarchies. Composition is more flexible (swap implementations), avoids fragile base class problems, and makes dependencies explicit.

```typescript
// ✗ Avoid: Deep inheritance
class BaseHandler extends EventEmitter {}
class WorkflowHandler extends BaseHandler {}
class PhaseHandler extends WorkflowHandler {}

// ✓ Prefer: Composition
class WorkflowHandler {
  constructor(
    private eventBus: EventBus,
    private phaseExecutor: PhaseExecutor
  ) {}
}
```

## Avoiding Circular Dependencies

Circular imports create initialization order issues and indicate tangled responsibilities. If A needs B and B needs A, extract the shared concern into C that both can depend on.

```typescript
// ✗ Wrong: Circular dependency
// workflowService.ts
import { StateManager } from './stateManager';
// stateManager.ts
import { WorkflowService } from './workflowService';

// ✓ Correct: Extract shared interface/type
// types.ts (no dependencies)
interface WorkflowState { ... }

// workflowService.ts
import { WorkflowState } from './types';
// stateManager.ts
import { WorkflowState } from './types';
```

</architecture_rules>

## Directory Structure

Organize code into role-based directories. This makes component purpose immediately clear from file location.

```
src/
├── commands/       # Presentation: CLI commands
├── handlers/       # Orchestration: event/request handlers
├── executors/      # Orchestration: task executors
├── services/       # Domain: stateless business logic
├── managers/       # Domain: state/lifecycle management
├── validators/     # Domain: validation logic
├── resolvers/      # Domain: reference resolution
├── registries/     # Infrastructure: registered item storage
├── loaders/        # Infrastructure: resource loading
├── clients/        # Infrastructure: external API clients
├── utils/          # Infrastructure: shared utilities
├── types/          # Type definitions
├── errors/         # Error classes
└── config/         # Configuration
```

### File Naming

- Pattern: `[role]/[name][Role].ts`
- Tests: `[role]/[name][Role].test.ts` (co-located)
- Barrels: `index.ts` for re-exports only, no logic

```
src/services/configService.ts
src/services/configService.test.ts
src/services/index.ts  # export { ConfigService } from './configService';
```

## Preferences

- **Pattern Selection**: Match component role to responsibility—stateless logic → Service; mutable state → Manager; coordination → Handler; external I/O → Loader/Client; lookups → Registry.
- **Composition**: Build components by combining smaller, focused pieces rather than inheriting behavior.
- **Constructor Injection**: Default to constructor injection; use method parameters for single-operation dependencies or values that vary per call.

## Exceptions

When external constraints prevent following a rule:

- **Valid scenarios**: Third-party library mandates a pattern (e.g., singleton), measured performance requirement, legacy migration in progress
- **Documentation**: Add block comment with reason, trade-offs, mitigation strategy, reference link, and approval date

```typescript
// EXCEPTION: Library X requires singleton pattern
// Reason: Library X's API mandates getInstance() for licensing
// Trade-off: Harder to test, hidden dependency
// Mitigation: Wrap in interface, inject wrapper in tests
// Reference: https://library-x.com/docs/licensing
// Approved: 2024-01-15
```

## Verification Checklist

When reviewing code for architecture compliance:

**Layer & Dependencies**

- [ ] Component is in the correct layer based on its responsibility
- [ ] Dependencies only flow downward (Presentation → Orchestration → Domain → Infrastructure)
- [ ] No Presentation → Infrastructure skip (should go through Domain/Orchestration)
- [ ] No upward dependencies (Infrastructure/Domain → Presentation/Orchestration)
- [ ] No circular imports between modules

**Component Design**

- [ ] Component has single responsibility (one reason to change)
- [ ] Role suffix matches actual responsibility (*Service, *Manager, \*Handler, etc.)
- [ ] Business logic is in Domain layer, not scattered in Orchestration/Presentation
- [ ] Composition used instead of deep inheritance hierarchies

**Dependency Injection**

- [ ] All dependencies passed via constructor (no hidden globals)
- [ ] No singleton patterns (`getInstance`, `instance` property)
- [ ] No service locator patterns (global registry lookups)
- [ ] Dependencies are explicit and injectable for testing

**Initialization**

- [ ] No async work in constructors
- [ ] Async initialization uses static factory method (`static create()`)
- [ ] Registries expose and require `initialize()` before use
- [ ] Registries guard against usage when not initialized
