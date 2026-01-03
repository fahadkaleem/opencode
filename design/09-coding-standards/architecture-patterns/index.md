# Architecture Patterns & Best Practices

> **Purpose**: This directory contains proven architectural patterns, design principles, and code quality standards extracted from the Gemini codebase. These patterns ensure clean architecture, testability, and long-term maintainability.

---

## 📚 How to Use This Guide

### **For New Developers**

Read in order (01 → 17) to build comprehensive understanding of all patterns.

### **For Specific Needs**

Jump directly to the pattern you need:

- Need to organize code? → [01 Project Structure](#01-project-structure-patterns)
- Implementing a feature? → [02 Architectural Design Patterns](#02-architectural-design-patterns)
- Writing types? → [03 Type Safety Patterns](#03-type-safety-patterns)
- Handling errors? → [04 Error Handling](#04-error-handling-patterns)
- Writing tests? → [05 Testing Patterns](#05-testing-patterns)

---

## 📖 Pattern Categories

### **Foundation Patterns** (Read First)

#### [01. Project Structure Patterns](./01-project-structure.md)

**94 lines** | Monorepo organization, package structure, directory layout

**Key Topics**:

- Monorepo organization with npm workspaces
- Core package structure (domain-driven)
- CLI package structure (UI separation)
- Clear package boundaries

**When to use**: Setting up new packages, organizing code, establishing project structure

---

#### [02. Architectural Design Patterns](./02-architectural-design-patterns.md)

**490 lines** | Core design patterns for building services and components

**Key Topics**:

- Layered architecture (3-layer model)
- Service pattern with interfaces
- Builder pattern for tools
- Registry pattern for component management
- Factory pattern for object creation
- Strategy pattern for swappable behaviors
- Message Bus pattern for decoupling
- Dependency Injection via Config

**When to use**: Designing new services, implementing business logic, structuring components

---

### **Code Quality Patterns**

#### [03. Type Safety Patterns](./03-type-safety-patterns.md)

**276 lines** | TypeScript type safety best practices

**Key Topics**:

- No `any` types (use `unknown` instead)
- Type guards for safe narrowing
- Discriminated unions for variants
- Explicit return types
- Generic types for flexibility
- Runtime validation with Zod

**When to use**: Writing type-safe code, validating inputs, handling variants

---

#### [04. Error Handling Patterns](./04-error-handling-patterns.md)

**364 lines** | Comprehensive error handling strategies

**Key Topics**:

- Error hierarchy with exit codes
- Error type guards
- Friendly error conversion
- Retry logic with exponential backoff
- Tool execution error handling

**When to use**: Creating custom errors, handling failures, implementing retries

---

#### [05. Testing Patterns](./05-testing-patterns.md)

**318 lines** | Testing strategies and best practices

**Key Topics**:

- Co-located tests
- AAA pattern (Arrange-Act-Assert)
- Mock objects via interfaces
- Temp directory isolation
- Test coverage requirements (80%+)
- Vitest configuration

**When to use**: Writing tests, creating mocks, setting up test infrastructure

---

### **Organization Patterns**

#### [06. Code Organization](./06-code-organization.md)

**146 lines** | File and code organization standards

**Key Topics**:

- File naming conventions (kebab-case)
- Variable and function naming (camelCase, PascalCase)
- Import organization (node: protocol, .js extensions)
- One export per file guideline

**When to use**: Creating new files, organizing imports, naming things

---

#### [07. Module Boundaries](./07-module-boundaries.md)

**180 lines** | Module system and API boundaries

**Key Topics**:

- Explicit public API via index.ts
- ES modules only (no CommonJS)
- Always use .js extension in imports
- Node.js built-in protocol (node:)
- No default exports (except oclif commands)

**When to use**: Defining public APIs, setting up exports, managing module boundaries

---

#### [08. Dependency Management](./08-dependency-management.md)

**175 lines** | Managing dependencies in monorepo

**Key Topics**:

- Workspace dependencies (workspace:\*)
- Dependency injection patterns
- Avoiding circular dependencies

**When to use**: Adding dependencies, injecting services, resolving circular deps

---

### **Configuration & Runtime**

#### [09. Configuration Management](./09-configuration-management.md)

**84 lines** | Configuration loading and management

**Key Topics**:

- Hierarchical configuration (defaults → env → settings → CLI)
- Settings files and CLI arguments
- Extension configuration
- Feature flags

**When to use**: Loading configuration, managing settings, implementing feature flags

---

#### [10. Process Management](./10-process-management.md)

**323 lines** | Spawning and managing child processes

**Key Topics**:

- Spawning processes safely
- Process lifecycle management
- Signal handling (SIGINT, SIGTERM)
- Resource cleanup
- Stream handling from processes

**When to use**: Running external commands, managing subprocesses, handling signals

---

#### [11. Stream Processing](./11-stream-processing.md)

**162 lines** | Handling streams and async iteration

**Key Topics**:

- Stream handling patterns
- Backpressure management
- Error handling in streams
- Async iteration

**When to use**: Processing large files, handling API streams, managing backpressure

---

### **Extensibility Patterns**

#### [12. Extension & Hook Patterns](./12-extension-hooks.md)

**482 lines** | Building extensible systems

**Key Topics**:

- Hook system design
- Plugin architecture
- Event-based extensions
- MCP (Model Context Protocol) integration
- Tool discovery and registration

**When to use**: Building plugin systems, implementing hooks, adding extensibility

---

#### [13. File Filtering Patterns](./13-file-filtering.md)

**206 lines** | Filtering files efficiently

**Key Topics**:

- Gitignore integration
- Custom filtering rules
- Performance considerations
- Workspace context

**When to use**: Implementing file discovery, respecting gitignore, filtering paths

---

#### [14. Performance Patterns](./14-performance.md)

**391 lines** | Performance optimization strategies

**Key Topics**:

- Caching strategies (LRU, TTL)
- Lazy loading patterns
- Resource pooling
- Debouncing and throttling
- Memory management

**When to use**: Optimizing performance, implementing caches, managing resources

---

#### [15. Workspace Management](./15-workspace-management.md)

**236 lines** | Managing workspace context

**Key Topics**:

- Workspace context management
- Multi-project support
- Workspace isolation
- Path resolution

**When to use**: Working with workspaces, managing project context, resolving paths

---

### **Development Tooling**

#### [16. Linting & Enforcement](./16-linting-enforcement.md)

**358 lines** | Code quality enforcement

**Key Topics**:

- ESLint configuration
- TypeScript strict mode settings
- Pre-commit hooks
- Automated checks (Husky, lint-staged)
- Import linting rules

**When to use**: Setting up linting, configuring hooks, enforcing code quality

---

#### [17. Build & Tooling Standards](./17-build-tooling.md)

**148 lines** | Build system and tooling setup

**Key Topics**:

- TypeScript configuration (NodeNext modules)
- Build system setup (tsup, tsc)
- Testing framework (Mocha/Vitest)
- Package.json scripts
- CI/CD integration

**When to use**: Setting up builds, configuring TypeScript, establishing tooling

---

## 🎯 Quick Reference

### **When Should I Use...?**

| Need                        | Pattern Document                                                 | Section                  |
| --------------------------- | ---------------------------------------------------------------- | ------------------------ |
| Organize a new package      | [01 Project Structure](./01-project-structure.md)                | Monorepo Organization    |
| Create a service            | [02 Architectural Design](./02-architectural-design-patterns.md) | Service Pattern          |
| Handle different behaviors  | [02 Architectural Design](./02-architectural-design-patterns.md) | Strategy Pattern         |
| Manage pluggable components | [02 Architectural Design](./02-architectural-design-patterns.md) | Registry Pattern         |
| Inject dependencies         | [02 Architectural Design](./02-architectural-design-patterns.md) | Dependency Injection     |
| Validate user input         | [03 Type Safety](./03-type-safety-patterns.md)                   | Zod Validation           |
| Narrow types safely         | [03 Type Safety](./03-type-safety-patterns.md)                   | Type Guards              |
| Create custom errors        | [04 Error Handling](./04-error-handling-patterns.md)             | Error Hierarchy          |
| Retry failed operations     | [04 Error Handling](./04-error-handling-patterns.md)             | Retry Logic              |
| Write unit tests            | [05 Testing](./05-testing-patterns.md)                           | AAA Pattern              |
| Create test mocks           | [05 Testing](./05-testing-patterns.md)                           | Mock Objects             |
| Name a new file             | [06 Code Organization](./06-code-organization.md)                | Naming Conventions       |
| Organize imports            | [06 Code Organization](./06-code-organization.md)                | Import Organization      |
| Define public API           | [07 Module Boundaries](./07-module-boundaries.md)                | Public API via index.ts  |
| Use ES modules              | [07 Module Boundaries](./07-module-boundaries.md)                | ES Modules Only          |
| Add workspace dependency    | [08 Dependency Management](./08-dependency-management.md)        | Workspace Dependencies   |
| Prevent circular deps       | [08 Dependency Management](./08-dependency-management.md)        | Avoiding Circular Deps   |
| Load configuration          | [09 Configuration](./09-configuration-management.md)             | Hierarchical Config      |
| Spawn a process             | [10 Process Management](./10-process-management.md)              | Spawning Processes       |
| Handle process signals      | [10 Process Management](./10-process-management.md)              | Signal Handling          |
| Process streams             | [11 Stream Processing](./11-stream-processing.md)                | Stream Handling          |
| Build plugin system         | [12 Extension & Hooks](./12-extension-hooks.md)                  | Hook System              |
| Filter files                | [13 File Filtering](./13-file-filtering.md)                      | Gitignore Integration    |
| Implement caching           | [14 Performance](./14-performance.md)                            | Caching Strategies       |
| Optimize performance        | [14 Performance](./14-performance.md)                            | Performance Optimization |
| Manage workspace context    | [15 Workspace Management](./15-workspace-management.md)          | Workspace Context        |
| Setup linting               | [16 Linting & Enforcement](./16-linting-enforcement.md)          | ESLint Configuration     |
| Configure TypeScript        | [17 Build & Tooling](./17-build-tooling.md)                      | TypeScript Configuration |
| Setup build system          | [17 Build & Tooling](./17-build-tooling.md)                      | Build System Setup       |

---

## 📊 Pattern Statistics

- **Total Pattern Documents**: 17
- **Total Lines of Documentation**: 4,433 lines
- **Average Document Length**: 260 lines
- **Largest Document**: [02 Architectural Design Patterns](./02-architectural-design-patterns.md) (490 lines)
- **Smallest Document**: [09 Configuration Management](./09-configuration-management.md) (84 lines)

---

## 🔄 Keep Patterns Updated

As Alfred evolves, these patterns should be:

- **Extracted from code reviews**: When you see a good pattern in PR, document it
- **Updated with API changes**: Keep examples current with latest APIs
- **Enhanced with lessons learned**: Add production insights and gotchas
- **Cross-referenced**: Link related patterns across documents

---

## 📝 How to Contribute

When adding or updating patterns:

1. **Follow the template**: Each pattern should have:
   - Clear problem statement
   - Code example (TypeScript with full imports)
   - Benefits/tradeoffs
   - When to use

2. **Keep examples realistic**: Use actual code from the codebase when possible

3. **Cross-reference liberally**: Link to related patterns in other documents

4. **Test your examples**: Ensure code examples compile and run

5. **Update the index**: Add new patterns to this index.md quick reference table

---

## 📚 Further Reading

After mastering these patterns, proceed to:

- [../01-system-overview.md](../01-system-overview.md) - Apply patterns to Alfred architecture
- [../02-architecture-overview.md](../02-architecture-overview.md) - See patterns in action
- [../03-core-concepts.md](../03-core-concepts.md) - Understand Alfred's domain model

---

## 🎓 Learning Path

### **Beginner (Week 1)**

1. Read [01 Project Structure](./01-project-structure.md)
2. Read [06 Code Organization](./06-code-organization.md)
3. Read [07 Module Boundaries](./07-module-boundaries.md)
4. Read [03 Type Safety](./03-type-safety-patterns.md)

### **Intermediate (Week 2)**

5. Read [02 Architectural Design](./02-architectural-design-patterns.md) (focus on Service, Factory)
6. Read [04 Error Handling](./04-error-handling-patterns.md)
7. Read [05 Testing](./05-testing-patterns.md)
8. Read [08 Dependency Management](./08-dependency-management.md)

### **Advanced (Week 3)**

9. Read [02 Architectural Design](./02-architectural-design-patterns.md) (full - Strategy, Message Bus)
10. Read [10 Process Management](./10-process-management.md)
11. Read [12 Extension & Hooks](./12-extension-hooks.md)
12. Read [14 Performance](./14-performance.md)

### **Expert (Week 4)**

13. Read all remaining patterns
14. Apply patterns to real Alfred features
15. Contribute new patterns from your work

---

**Original Source**: All patterns extracted from `00-architecture-patterns.md` (4,461 lines)
**Last Updated**: 2025-11-21
