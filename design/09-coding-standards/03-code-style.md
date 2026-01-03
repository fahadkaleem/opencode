# Code Style & Formatting

Reference: `design/09-coding-standards/standards-reference/03-code-style.md`

<code_style_rules>

## Imports

- **Import Order**: Group imports with blank lines between groups. This creates visual separation and makes dependencies clear at a glance.
  1. Node.js built-ins (with `node:` protocol)
  2. External packages (npm dependencies)
  3. Internal relative imports

  ```typescript
  import * as fs from 'node:fs/promises';
  import * as path from 'node:path';

  import { z } from 'zod';
  import { describe, it, expect } from 'vitest';

  import { Config } from './config.js';
  import type { UserSettings } from './types.js';
  ```

- **Node.js Protocol**: Use `node:` prefix for Node.js built-ins. This disambiguates built-ins from npm packages with similar names and is the modern ESM convention.
  - ✓ `import * as fs from 'node:fs/promises'`
  - ✗ `import * as fs from 'fs/promises'`

- **File Extensions**: Include `.js` extension in relative imports (even for TypeScript files). ESM requires explicit extensions for resolution.
  - ✓ `import { Config } from './config.js'`
  - ✗ `import { Config } from './config'`

- **Type-Only Imports**: Use `import type` for types that don't exist at runtime. This ensures they're removed during compilation and prevents bundling issues.
  - ✓ `import type { User } from './types.js'`
  - ✗ `import { User } from './types.js'` (when User is only a type)

- **ES Modules Only**: Use ES6 `import` syntax. CommonJS `require()` breaks tree-shaking and isn't compatible with ESM-first tooling.
  - ✓ `import { readFile } from 'node:fs/promises'`
  - ✗ `const fs = require('fs')`

## Formatting

- **Indentation**: Use 2 spaces. Tabs are forbidden except in Makefiles (which require them). Consistent indentation prevents merge conflicts and improves readability.

  ```typescript
  function example() {
    if (condition) {
      doSomething();
    }
  }
  ```

- **Line Length**: Keep lines under 80 characters. Long lines are hard to read, cause horizontal scrolling, and don't display well in side-by-side diffs.

- **Semicolons**: End all statements with semicolons. Explicit semicolons prevent ASI (Automatic Semicolon Insertion) bugs that can cause subtle runtime errors.
  - ✓ `const value = 42;`
  - ✗ `const value = 42`

- **Quote Style**: Use single quotes for strings. Reserve double quotes for JSX attributes and strings containing single quotes. Consistency reduces cognitive load.
  - ✓ `const message = 'Hello';`
  - ✓ `const quote = "It's working";`
  - ✓ `<Button label="Click me" />`
  - ✗ `const message = "Hello";`

- **Trailing Commas**: Include trailing commas in multi-line arrays, objects, and parameter lists. This makes diffs cleaner when adding/removing items.

  ```typescript
  const config = {
    name: 'app',
    version: '1.0.0', // trailing comma
  };
  ```

- **Line Endings**: Use LF only (no CRLF). Mixed line endings cause unnecessary diff noise and cross-platform issues.

- **Final Newline**: End all files with a single trailing newline. POSIX convention that prevents "no newline at end of file" warnings.

## Variables & Declarations

- **Variable Declarations**: Use `const` by default; use `let` only when reassignment is needed. This communicates intent and prevents accidental reassignment. Never use `var` because it has function scope instead of block scope.
  - ✓ `const user = getUser();`
  - ✓ `let count = 0; count++;`
  - ✗ `var user = getUser();`

- **Unused Variables**: Remove unused variables. Prefix intentionally unused parameters with `_` to signal they're required by an interface but not used.
  - ✓ `array.map((_, index) => index)`
  - ✗ `const unused = getValue();` (if never used)

## Operators & Expressions

- **Equality Operators**: Use `===`/`!==` for comparisons. Loose equality (`==`/`!=`) has confusing coercion rules. Exception: `== null` is allowed as a shorthand for `=== null || === undefined`.
  - ✓ `if (value === 'active')`
  - ✓ `if (value == null)` (checks null and undefined)
  - ✗ `if (value == 'active')`

- **Arrow Functions**: Use arrow functions for callbacks. Omit braces and `return` when the body is a single expression. This reduces noise and makes intent clear.
  - ✓ `items.map(item => item.id)`
  - ✓ `items.filter(item => item.isActive)`
  - ✗ `items.map(function(item) { return item.id; })`

- **Object Shorthand**: Use property and method shorthand when variable names match property names. This reduces repetition.
  - ✓ `const obj = { name, value, getId() { return this.id; } };`
  - ✗ `const obj = { name: name, value: value };`

## Control Flow

- **Curly Braces**: Use braces when control-flow bodies span multiple lines. Single-line bodies may omit braces for brevity, but be consistent within a file.

  ```typescript
  // Both acceptable for single-line
  if (isValid) return value;
  if (isValid) {
    return value;
  }

  // Multi-line always needs braces
  if (isValid) {
    logSuccess();
    return value;
  }
  ```

- **Switch Default Case**: Include a `default` case in every `switch`. This makes handling of unexpected values explicit, even if the default is empty with a comment.
  ```typescript
  switch (status) {
    case 'active':
      return handleActive();
    case 'inactive':
      return handleInactive();
    default:
      // Exhaustive check - should never reach here
      throw new Error(`Unknown status: ${status}`);
  }
  ```

## TypeScript

- **Type Assertions**: Use `as` syntax for assertions. Angle-bracket syntax conflicts with JSX and isn't consistent with modern TypeScript.
  - ✓ `const element = event.target as HTMLInputElement;`
  - ✗ `const element = <HTMLInputElement>event.target;`

- **Avoid `any`**: Use `unknown` instead of `any` and narrow with type guards. `any` disables type checking and lets bugs slip through. `unknown` forces you to verify the type before use.
  - ✓ `function parse(input: unknown): User { if (isUser(input)) return input; }`
  - ✗ `function parse(input: any): User { return input; }`

- **Member Accessibility**: Omit `public` (it's the default). Use `private`/`protected` explicitly when restricting access. This reduces noise while keeping restrictions visible.
  - ✓ `class Foo { name: string; private _cache: Map<...>; }`
  - ✗ `class Foo { public name: string; }`

- **Array Type Notation**: Use `T[]` for simple arrays; use `Array<T>` for complex types like unions or intersections. This improves readability.
  - ✓ `const ids: string[]`
  - ✓ `const items: Array<User | Guest>`
  - ✗ `const items: (User | Guest)[]` (harder to read)

## Error Handling

- **Throw Error Objects**: Throw only `Error` instances or subclasses. Throwing strings loses the stack trace and prevents `instanceof` checks.
  - ✓ `throw new ValidationError('Invalid input');`
  - ✗ `throw 'Invalid input';`

</code_style_rules>

## Preferences

- **Named Exports**: Prefer named exports over default exports. Named exports enable safer refactoring (renames propagate), better tree-shaking, and consistent import syntax. Exception: frameworks like oclif require default exports.

## Exceptions

When external constraints prevent following a rule:

- **Test mocks**: May use `any` when typing would be excessively complex. Document with an ESLint disable comment explaining why.
- **Framework requirements**: Default exports are allowed when required (e.g., oclif commands). Add a comment noting the framework requirement.
- **Legacy migrations**: May temporarily violate rules. Document with a migration ticket reference and expected resolution date.

## Verification Checklist

When reviewing code for style compliance:

- [ ] Imports are grouped: Node.js (`node:*`) → external → internal, with blank lines between
- [ ] Node.js imports use `node:` protocol
- [ ] Relative imports include `.js` extension
- [ ] Type-only imports use `import type`
- [ ] No `require()` calls
- [ ] Indentation is 2 spaces (no tabs)
- [ ] Lines are under 80 characters
- [ ] Statements end with semicolons
- [ ] Strings use single quotes (except JSX attributes and strings with apostrophes)
- [ ] Multi-line arrays/objects have trailing commas
- [ ] `const` by default, `let` only when reassigning, no `var`
- [ ] Strict equality (`===`/`!==`) except `== null`
- [ ] Arrow functions for callbacks with concise syntax
- [ ] No `any` (use `unknown` with type guards)
- [ ] Type assertions use `as` syntax (not angle brackets)
- [ ] No explicit `public` keyword
- [ ] `switch` statements have `default` case
- [ ] Only `Error` objects are thrown (not strings)
- [ ] Unused variables removed or prefixed with `_`
