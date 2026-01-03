---
title: Workspace Management Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - Tool Layer
related_patterns:
  - ./06-code-organization.md#service-pattern
  - ./13-file-filtering.md
  - ./04-error-handling-patterns.md#graceful-degradation
---

# 15. Workspace Management Patterns

> **Purpose**: Manage multi-directory workspace contexts with path validation, observable changes, and security boundaries for file operations.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Workspace Context Class](#pattern-1-workspace-context-class)
- [Pattern 2: Observable Directory Changes](#pattern-2-observable-directory-changes)
- [Pattern 3: Path Containment Validation](#pattern-3-path-containment-validation)
- [Pattern 4: Symlink Resolution](#pattern-4-symlink-resolution)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Workspace management provides controlled access to multiple directories during task execution. This pattern is essential for security (preventing access outside designated areas), multi-project workflows (operating on files across repositories), and dynamic workspace modification during runtime.

A robust workspace context validates all paths, resolves symbolic links to prevent escaping workspace boundaries, notifies observers when directories change, and integrates with all file operation tools to enforce security boundaries.

**Why workspace management matters:**

- Security: Prevent file operations outside designated directories
- Multi-project support: Operate across multiple repositories simultaneously
- Path validation: Ensure all file paths are within allowed boundaries
- Observable changes: React to runtime workspace modifications
- Symlink safety: Handle symbolic links that may escape workspace

**In this document:**

- **Workspace Context Class** - Central class managing multiple workspace directories
- **Observable Directory Changes** - Subscribe/notify pattern for workspace modifications
- **Path Containment Validation** - Security validation for all file paths
- **Symlink Resolution** - Safe handling of symbolic links and circular references

**Prerequisites:**

- Understanding of file system paths and resolution
- Familiarity with observer pattern
- Knowledge of symbolic links and security implications

---

## Pattern 1: Workspace Context Class

### Intent

Manage multiple workspace directories with validation, deduplication, and immutable snapshots of initial state.

### Problem

CLI tools often need to operate on files across multiple directories (main project, shared libraries, external dependencies). Without centralized workspace management, path validation is scattered throughout the codebase, leading to inconsistent security checks and difficulty tracking which directories are in scope. Additionally, relative paths, symbolic links, and non-existent directories complicate validation logic.

### Solution

Create a `WorkspaceContext` class that maintains a set of validated, absolute directory paths. All directory additions go through validation (existence, is directory, readable). Paths are resolved to real paths (following symlinks) to prevent duplicates. Initial directories are preserved for modification tracking.

### Structure

```typescript
export class WorkspaceContext {
  private directories: Set<string>; // Current directories
  private initialDirectories: Set<string>; // Snapshot at construction
  private onDirectoriesChangedListeners: Set<() => void>;

  constructor(targetDir: string, additionalDirectories: string[] = []);
  addDirectory(directory: string): void;
  getDirectories(): readonly string[];
  isPathWithinWorkspace(pathToCheck: string): boolean;
  onDirectoriesChanged(listener: () => void): Unsubscribe;
}
```

### Implementation

**Step 1: Define core data structures**

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';

export type Unsubscribe = () => void;

export class WorkspaceContext {
  private directories = new Set<string>();
  private initialDirectories: Set<string>;
  private onDirectoriesChangedListeners = new Set<() => void>();

  constructor(
    readonly targetDir: string,
    additionalDirectories: string[] = []
  ) {
    this.addDirectory(targetDir);
    for (const additionalDirectory of additionalDirectories) {
      this.addDirectory(additionalDirectory);
    }
    this.initialDirectories = new Set(this.directories);
  }
}
```

**Step 2: Implement directory validation**

```typescript
private resolveAndValidateDir(directory: string): string {
  // Resolve relative to targetDir
  const absolutePath = path.resolve(this.targetDir, directory);

  // Check existence
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Directory does not exist: ${absolutePath}`);
  }

  // Check is directory
  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${absolutePath}`);
  }

  // Resolve symlinks to real path (prevents duplicates)
  return fs.realpathSync(absolutePath);
}
```

**Step 3: Add directory with validation**

```typescript
addDirectory(directory: string): void {
  try {
    const resolved = this.resolveAndValidateDir(directory);
    if (this.directories.has(resolved)) {
      return; // Duplicate - skip
    }
    this.directories.add(resolved);
    this.notifyDirectoriesChanged();
  } catch (err) {
    // Log warning but don't fail
    console.warn(
      `[WARN] Skipping unreadable directory: ${directory} (${err instanceof Error ? err.message : String(err)})`,
    );
  }
}
```

**Step 4: Provide immutable access**

```typescript
getDirectories(): readonly string[] {
  return Array.from(this.directories);
}

getInitialDirectories(): readonly string[] {
  return Array.from(this.initialDirectories);
}

setDirectories(directories: readonly string[]): void {
  const newDirectories = new Set<string>();
  for (const dir of directories) {
    newDirectories.add(this.resolveAndValidateDir(dir));
  }

  // Only notify if changed
  if (
    newDirectories.size !== this.directories.size ||
    ![...newDirectories].every((d) => this.directories.has(d))
  ) {
    this.directories = newDirectories;
    this.notifyDirectoriesChanged();
  }
}
```

### Complete Example

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';

export type Unsubscribe = () => void;

export class WorkspaceContext {
  private directories = new Set<string>();
  private initialDirectories: Set<string>;
  private onDirectoriesChangedListeners = new Set<() => void>();

  constructor(
    readonly targetDir: string,
    additionalDirectories: string[] = []
  ) {
    this.addDirectory(targetDir);
    for (const additionalDirectory of additionalDirectories) {
      this.addDirectory(additionalDirectory);
    }
    this.initialDirectories = new Set(this.directories);
  }

  addDirectory(directory: string): void {
    try {
      const resolved = this.resolveAndValidateDir(directory);
      if (this.directories.has(resolved)) {
        return;
      }
      this.directories.add(resolved);
      this.notifyDirectoriesChanged();
    } catch (err) {
      console.warn(
        `[WARN] Skipping unreadable directory: ${directory} (${err instanceof Error ? err.message : String(err)})`
      );
    }
  }

  private resolveAndValidateDir(directory: string): string {
    const absolutePath = path.resolve(this.targetDir, directory);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Directory does not exist: ${absolutePath}`);
    }
    const stats = fs.statSync(absolutePath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${absolutePath}`);
    }

    return fs.realpathSync(absolutePath);
  }

  getDirectories(): readonly string[] {
    return Array.from(this.directories);
  }

  getInitialDirectories(): readonly string[] {
    return Array.from(this.initialDirectories);
  }

  setDirectories(directories: readonly string[]): void {
    const newDirectories = new Set<string>();
    for (const dir of directories) {
      newDirectories.add(this.resolveAndValidateDir(dir));
    }

    if (
      newDirectories.size !== this.directories.size ||
      ![...newDirectories].every((d) => this.directories.has(d))
    ) {
      this.directories = newDirectories;
      this.notifyDirectoriesChanged();
    }
  }

  onDirectoriesChanged(listener: () => void): Unsubscribe {
    this.onDirectoriesChangedListeners.add(listener);
    return () => {
      this.onDirectoriesChangedListeners.delete(listener);
    };
  }

  private notifyDirectoriesChanged() {
    for (const listener of [...this.onDirectoriesChangedListeners]) {
      try {
        listener();
      } catch (e) {
        console.error(
          `Error in WorkspaceContext listener: (${e instanceof Error ? e.message : String(e)})`
        );
      }
    }
  }
}
```

**Example explained:**

- Lines 1-5: Import Node.js path and fs modules, define Unsubscribe type
- Lines 7-17: Class with three data structures (directories, initial snapshot, listeners)
- Lines 19-28: Constructor validates and adds all directories, saves initial state
- Lines 30-42: addDirectory validates, deduplicates, and notifies on changes
- Lines 44-57: resolveAndValidateDir ensures existence, is directory, resolves symlinks
- Lines 59-75: Getter methods provide immutable access and bulk updates
- Lines 77-94: Observer pattern for change notifications with error isolation

### When to Use

**Use this pattern when:**

- Supporting multi-directory task execution (main project + dependencies)
- Enforcing security boundaries for file operations
- Allowing dynamic workspace modification during execution
- Handling relative paths from different base directories
- Dealing with symbolic links that may escape workspace

**Avoid this pattern when:**

- Single-directory operations only (simple cwd is sufficient)
- No security requirements for path containment
- Static workspace that never changes
- Performance-critical path operations (validation has overhead)

### Benefits

- **Security**: All paths validated against workspace boundaries
- **Deduplication**: Symlinks resolved to prevent duplicate directories
- **Observability**: Change notifications for reactive updates
- **Graceful Degradation**: Invalid directories logged as warnings, not failures
- **Immutability**: Returns readonly arrays, prevents external modification

### Trade-offs

- **Performance**: File system operations (stat, realpath) on every directory addition
- **Memory**: Maintains two sets of directories (current + initial)
- **Complexity**: More complex than simple string array of paths
- **Startup Cost**: All directories validated at construction time

### Common Mistakes

**Mistake 1: Not resolving symlinks before deduplication**

Bad example:

```typescript
addDirectory(directory: string): void {
  const absolutePath = path.resolve(directory);
  this.directories.add(absolutePath); // Symlinks not resolved
}
```

Correct approach:

```typescript
addDirectory(directory: string): void {
  const resolved = this.resolveAndValidateDir(directory);
  // fs.realpathSync() in validation resolves symlinks
  this.directories.add(resolved);
}
```

**Why this matters**: Without symlink resolution, the same directory added via different symlink paths will be duplicated in the set. This wastes resources and breaks containment checks.

**Mistake 2: Throwing errors for invalid directories during construction**

Bad example:

```typescript
constructor(targetDir: string, additionalDirectories: string[] = []) {
  this.addDirectory(targetDir);
  for (const dir of additionalDirectories) {
    const resolved = this.resolveAndValidateDir(dir); // Throws on invalid
    this.directories.add(resolved);
  }
}
```

Correct approach:

```typescript
constructor(targetDir: string, additionalDirectories: string[] = []) {
  this.addDirectory(targetDir); // Validates targetDir
  for (const dir of additionalDirectories) {
    this.addDirectory(dir); // Catches errors internally, logs warning
  }
}
```

**Why this matters**: Optional directories should not cause initialization failure. Log warnings for missing/invalid directories but continue with valid ones. Only the primary targetDir should fail construction if invalid.

**Mistake 3: Returning mutable directory array**

Bad example:

```typescript
getDirectories(): string[] {
  return Array.from(this.directories); // Mutable array
}
// Caller can modify: workspace.getDirectories().push('/evil/path');
```

Correct approach:

```typescript
getDirectories(): readonly string[] {
  return Array.from(this.directories); // Readonly prevents modification
}
```

**Why this matters**: Returning mutable arrays allows external code to bypass validation by directly modifying the returned array. Use `readonly` to enforce immutability.

### Testing Strategy

**What to Test:**

- Directory initialization (single and multiple directories)
- Directory validation (existence, is directory, readable)
- Symlink resolution and deduplication
- Relative path resolution
- Invalid directory handling (non-existent, not a directory, circular symlinks)
- Immutability of returned arrays

**Test Organization:**

- Co-locate test: `workspaceContext.ts` → `workspaceContext.test.ts`
- Use real file system with temp directories (not mocks)
- Use AAA pattern for each test
- Group tests by functionality (initialization, validation, symlinks)

**Mock Strategy:**

- Use real file system operations with temp directories
- Mock logger to verify warning messages
- No mocking of fs module (test real behavior)

**Test Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { WorkspaceContext } from './workspaceContext.js';

describe('WorkspaceContext', () => {
  let tempDir: string;
  let cwd: string;
  let otherDir: string;

  beforeEach(() => {
    // Create temp directory structure
    tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-')));
    cwd = path.join(tempDir, 'project');
    otherDir = path.join(tempDir, 'other-project');

    fs.mkdirSync(cwd, { recursive: true });
    fs.mkdirSync(otherDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should initialize with a single directory', () => {
      // Arrange & Act
      const workspace = new WorkspaceContext(cwd);

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toEqual([cwd]);
    });

    it('should initialize with multiple directories', () => {
      // Arrange & Act
      const workspace = new WorkspaceContext(cwd, [otherDir]);

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toEqual([cwd, otherDir]);
    });

    it('should skip non-existent optional directories', () => {
      // Arrange
      const nonExistent = path.join(tempDir, 'does-not-exist');

      // Act
      const workspace = new WorkspaceContext(cwd, [nonExistent, otherDir]);

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toEqual([cwd, otherDir]);
    });
  });

  describe('adding directories', () => {
    it('should add valid directories', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);

      // Act
      workspace.addDirectory(otherDir);

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toEqual([cwd, otherDir]);
    });

    it('should prevent duplicate directories', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);
      workspace.addDirectory(otherDir);

      // Act
      workspace.addDirectory(otherDir); // Duplicate

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toHaveLength(2);
    });

    it('should resolve relative paths to absolute', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);
      const relativePath = path.relative(cwd, otherDir);

      // Act
      workspace.addDirectory(relativePath);

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toEqual([cwd, otherDir]);
    });
  });

  describe('symlink handling', () => {
    it.skipIf(os.platform() === 'win32')('should resolve symlinks to real paths', () => {
      // Arrange
      const realDir = path.join(tempDir, 'real');
      fs.mkdirSync(realDir, { recursive: true });
      const symlinkDir = path.join(tempDir, 'symlink-to-real');
      fs.symlinkSync(realDir, symlinkDir, 'dir');

      const workspace = new WorkspaceContext(cwd);

      // Act
      workspace.addDirectory(symlinkDir);

      // Assert
      const directories = workspace.getDirectories();
      expect(directories).toEqual([cwd, realDir]);
    });
  });

  describe('getDirectories', () => {
    it('should return immutable copy', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);

      // Act
      const dirs1 = workspace.getDirectories();
      const dirs2 = workspace.getDirectories();

      // Assert
      expect(dirs1).not.toBe(dirs2); // Different references
      expect(dirs1).toEqual(dirs2); // Same content
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Statement coverage: 90%+
- Function coverage: 100%
- Branch coverage: 85%+ (include symlink edge cases)

### Related Patterns

- **[Observable Pattern](./02-architectural-design-patterns.md#observer-pattern)** - Change notification system
- **[File Filtering](./13-file-filtering.md)** - Uses workspace context for boundary enforcement
- **[Graceful Degradation](./04-error-handling-patterns.md#graceful-degradation)** - Invalid directories logged, not failed

---

## Pattern 2: Observable Directory Changes

### Intent

Notify observers when workspace directories are added, removed, or replaced to enable reactive updates in dependent systems.

### Problem

Multiple systems may depend on workspace directories (file discovery services, path validators, UI components displaying workspace state). Without a notification mechanism, these systems must poll for changes or receive manual updates, leading to stale state and synchronization bugs.

### Solution

Implement observer pattern with subscription/unsubscription. Maintain a set of listener callbacks. Notify all listeners when directories change. Isolate listener errors to prevent one failing listener from breaking others.

### Structure

```typescript
export class WorkspaceContext {
  private onDirectoriesChangedListeners = new Set<() => void>();

  onDirectoriesChanged(listener: () => void): Unsubscribe {
    this.onDirectoriesChangedListeners.add(listener);
    return () => this.onDirectoriesChangedListeners.delete(listener);
  }

  private notifyDirectoriesChanged(): void {
    for (const listener of [...this.onDirectoriesChangedListeners]) {
      try {
        listener();
      } catch (e) {
        console.error(`Error in listener: ${e}`);
      }
    }
  }
}
```

### Implementation

**Step 1: Define listener storage**

```typescript
export type Unsubscribe = () => void;

export class WorkspaceContext {
  private onDirectoriesChangedListeners = new Set<() => void>();
}
```

**Step 2: Implement subscription with cleanup**

```typescript
onDirectoriesChanged(listener: () => void): Unsubscribe {
  this.onDirectoriesChangedListeners.add(listener);
  return () => {
    this.onDirectoriesChangedListeners.delete(listener);
  };
}
```

**Step 3: Notify with error isolation**

```typescript
private notifyDirectoriesChanged() {
  // Iterate over copy in case listener unsubscribes itself
  for (const listener of [...this.onDirectoriesChangedListeners]) {
    try {
      listener();
    } catch (e) {
      // Don't let one listener break others
      console.error(
        `Error in WorkspaceContext listener: (${e instanceof Error ? e.message : String(e)})`,
      );
    }
  }
}
```

**Step 4: Call notify on changes**

```typescript
addDirectory(directory: string): void {
  const resolved = this.resolveAndValidateDir(directory);
  if (this.directories.has(resolved)) {
    return; // No change, no notification
  }
  this.directories.add(resolved);
  this.notifyDirectoriesChanged(); // Notify after change
}

setDirectories(directories: readonly string[]): void {
  // ... validation ...
  if (/* changed */) {
    this.directories = newDirectories;
    this.notifyDirectoriesChanged(); // Notify after change
  }
}
```

### Complete Example

```typescript
export type Unsubscribe = () => void;

export class WorkspaceContext {
  private directories = new Set<string>();
  private onDirectoriesChangedListeners = new Set<() => void>();

  constructor(
    readonly targetDir: string,
    additionalDirectories: string[] = []
  ) {
    this.addDirectory(targetDir);
    for (const dir of additionalDirectories) {
      this.addDirectory(dir);
    }
  }

  onDirectoriesChanged(listener: () => void): Unsubscribe {
    this.onDirectoriesChangedListeners.add(listener);
    return () => {
      this.onDirectoriesChangedListeners.delete(listener);
    };
  }

  private notifyDirectoriesChanged() {
    for (const listener of [...this.onDirectoriesChangedListeners]) {
      try {
        listener();
      } catch (e) {
        console.error(
          `Error in WorkspaceContext listener: (${e instanceof Error ? e.message : String(e)})`
        );
      }
    }
  }

  addDirectory(directory: string): void {
    try {
      const resolved = this.resolveAndValidateDir(directory);
      if (this.directories.has(resolved)) {
        return;
      }
      this.directories.add(resolved);
      this.notifyDirectoriesChanged();
    } catch (err) {
      console.warn(`Skipping: ${directory}`);
    }
  }

  private resolveAndValidateDir(directory: string): string {
    // Implementation from Pattern 1
    return directory;
  }
}

// Usage
const workspace = new WorkspaceContext('/project');

// Subscribe to changes
const unsubscribe = workspace.onDirectoriesChanged(() => {
  console.log('Workspace changed:', workspace.getDirectories());
});

// Trigger notification
workspace.addDirectory('/other-project'); // Logs: "Workspace changed: ['/project', '/other-project']"

// Cleanup
unsubscribe();
workspace.addDirectory('/third-project'); // No log (unsubscribed)
```

**Example explained:**

- Lines 1-14: WorkspaceContext with listener storage
- Lines 16-21: Subscription returns cleanup function
- Lines 23-32: Notification with error isolation and array copy
- Lines 34-45: addDirectory notifies only on actual changes
- Lines 47-65: Usage example showing subscribe, trigger, unsubscribe

### When to Use

**Use this pattern when:**

- Multiple systems depend on workspace state (UI, file discovery, validation)
- Workspace can change dynamically during execution
- Need reactive updates rather than polling
- Loose coupling between workspace and dependent systems

**Avoid this pattern when:**

- Workspace is static and never changes
- Only one consumer of workspace state
- Performance-critical code (notification has overhead)
- Simple callback is sufficient (no need for multiple listeners)

### Benefits

- **Reactive Updates**: Consumers updated immediately on changes
- **Loose Coupling**: Workspace doesn't know about consumers
- **Error Isolation**: Failing listener doesn't break others
- **Easy Cleanup**: Unsubscribe function prevents memory leaks
- **Multiple Listeners**: Supports unlimited observers

### Trade-offs

- **Memory**: Stores all listener functions
- **Performance**: Iteration overhead on every change
- **Error Handling**: Silent error swallowing (logged but not propagated)
- **Debugging**: Harder to trace notification chains

### Common Mistakes

**Mistake 1: Not copying listener array before iteration**

Bad example:

```typescript
private notifyDirectoriesChanged() {
  for (const listener of this.onDirectoriesChangedListeners) {
    listener(); // Error if listener unsubscribes itself
  }
}
```

Correct approach:

```typescript
private notifyDirectoriesChanged() {
  // Copy array before iteration
  for (const listener of [...this.onDirectoriesChangedListeners]) {
    listener(); // Safe even if listener unsubscribes
  }
}
```

**Why this matters**: If a listener calls unsubscribe during notification, iterating over the live set throws an error. Copying the array prevents this.

**Mistake 2: Notifying even when no change occurred**

Bad example:

```typescript
addDirectory(directory: string): void {
  const resolved = this.resolveAndValidateDir(directory);
  this.directories.add(resolved); // May be duplicate
  this.notifyDirectoriesChanged(); // Always notifies
}
```

Correct approach:

```typescript
addDirectory(directory: string): void {
  const resolved = this.resolveAndValidateDir(directory);
  if (this.directories.has(resolved)) {
    return; // No change, no notification
  }
  this.directories.add(resolved);
  this.notifyDirectoriesChanged(); // Only notify on change
}
```

**Why this matters**: Unnecessary notifications trigger re-renders, re-validations, and waste resources. Only notify when state actually changes.

### Testing Strategy

**What to Test:**

- Listener called when directory added
- Listener not called when duplicate directory added
- Listener not called when same directories set
- Multiple listeners all notified
- Unsubscribe prevents future notifications
- Listener errors don't break other listeners

**Test Organization:**

- Group tests in `describe('onDirectoriesChanged')` block
- Use Vitest's `vi.fn()` for listener mocks
- Test subscription, notification, and cleanup

**Mock Strategy:**

- Mock listeners with `vi.fn()`
- Use real WorkspaceContext (not mocked)
- Mock logger to verify error handling

**Test Example:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { WorkspaceContext } from './workspaceContext.js';

describe('WorkspaceContext - Observable', () => {
  describe('onDirectoriesChanged', () => {
    it('should call listener when adding a directory', () => {
      // Arrange
      const workspace = new WorkspaceContext('/project');
      const listener = vi.fn();
      workspace.onDirectoriesChanged(listener);

      // Act
      workspace.addDirectory('/other-project');

      // Assert
      expect(listener).toHaveBeenCalledOnce();
    });

    it('should not call listener when adding duplicate', () => {
      // Arrange
      const workspace = new WorkspaceContext('/project');
      workspace.addDirectory('/other-project');
      const listener = vi.fn();
      workspace.onDirectoriesChanged(listener);

      // Act
      workspace.addDirectory('/other-project'); // Duplicate

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      // Arrange
      const workspace = new WorkspaceContext('/project');
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      workspace.onDirectoriesChanged(listener1);
      workspace.onDirectoriesChanged(listener2);

      // Act
      workspace.addDirectory('/other-project');

      // Assert
      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();
    });

    it('should allow unsubscribing', () => {
      // Arrange
      const workspace = new WorkspaceContext('/project');
      const listener = vi.fn();
      const unsubscribe = workspace.onDirectoriesChanged(listener);

      // Act
      unsubscribe();
      workspace.addDirectory('/other-project');

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not fail if listener throws error', () => {
      // Arrange
      const workspace = new WorkspaceContext('/project');
      const errorListener = () => {
        throw new Error('test error');
      };
      const listener = vi.fn();
      workspace.onDirectoriesChanged(errorListener);
      workspace.onDirectoriesChanged(listener);

      // Act & Assert
      expect(() => {
        workspace.addDirectory('/other-project');
      }).not.toThrow();
      expect(listener).toHaveBeenCalledOnce();
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: 100% (all notification paths)
- Function coverage: 100%

### Related Patterns

- **[Observer Pattern](./02-architectural-design-patterns.md#observer-pattern)** - Classic implementation
- **[Error Isolation](./04-error-handling-patterns.md#error-isolation)** - Preventing listener errors from propagating

---

## Pattern 3: Path Containment Validation

### Intent

Validate that file paths are within workspace boundaries to prevent unauthorized file system access outside designated directories.

### Problem

Without path containment validation, tools can access any file on the system, creating security vulnerabilities. Attackers could craft paths using `..` to escape workspace directories. Symbolic links complicate validation since they can point outside the workspace. Non-existent paths need validation too (for creation operations).

### Solution

Implement `isPathWithinWorkspace()` that fully resolves paths (including symlinks), then checks if the resolved path is within any workspace directory using relative path calculation. Handle special cases: non-existent paths (resolve as far as possible), symlinks to files (reject if target is outside), circular symlinks (gracefully return false).

### Structure

```typescript
export class WorkspaceContext {
  isPathWithinWorkspace(pathToCheck: string): boolean {
    const fullyResolvedPath = this.fullyResolvedPath(pathToCheck);

    for (const dir of this.directories) {
      if (this.isPathWithinRoot(fullyResolvedPath, dir)) {
        return true;
      }
    }
    return false;
  }

  private isPathWithinRoot(pathToCheck: string, rootDirectory: string): boolean {
    const relative = path.relative(rootDirectory, pathToCheck);
    return !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
  }
}
```

### Implementation

**Step 1: Fully resolve paths including symlinks**

```typescript
import { isNodeError } from '../utils/errors.js';

private fullyResolvedPath(pathToCheck: string): string {
  try {
    return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  } catch (e: unknown) {
    if (
      isNodeError(e) &&
      e.code === 'ENOENT' &&
      e.path &&
      !this.isFileSymlink(e.path)
    ) {
      // If doesn't exist, e.path contains fully resolved path
      return e.path;
    }
    throw e; // Circular symlink or other error
  }
}
```

**Step 2: Check if symlink points to file**

```typescript
private isFileSymlink(filePath: string): boolean {
  try {
    // readlinkSync returns target path
    // Directory symlinks end with '/'
    return !fs.readlinkSync(filePath).endsWith('/');
  } catch (_error) {
    return false;
  }
}
```

**Step 3: Check containment using relative paths**

```typescript
private isPathWithinRoot(
  pathToCheck: string,
  rootDirectory: string,
): boolean {
  const relative = path.relative(rootDirectory, pathToCheck);
  return (
    !relative.startsWith(`..${path.sep}`) && // Not parent
    relative !== '..' &&                      // Not exactly parent
    !path.isAbsolute(relative)                // Not different root
  );
}
```

**Step 4: Main validation method**

```typescript
isPathWithinWorkspace(pathToCheck: string): boolean {
  try {
    const fullyResolvedPath = this.fullyResolvedPath(pathToCheck);

    for (const dir of this.directories) {
      if (this.isPathWithinRoot(fullyResolvedPath, dir)) {
        return true;
      }
    }
    return false;
  } catch (_error) {
    // Circular symlink or other error
    return false;
  }
}
```

### Complete Example

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';
import { isNodeError } from '../utils/errors.js';

export class WorkspaceContext {
  private directories = new Set<string>();

  constructor(
    readonly targetDir: string,
    additionalDirectories: string[] = []
  ) {
    // ... initialization ...
  }

  isPathWithinWorkspace(pathToCheck: string): boolean {
    try {
      const fullyResolvedPath = this.fullyResolvedPath(pathToCheck);

      for (const dir of this.directories) {
        if (this.isPathWithinRoot(fullyResolvedPath, dir)) {
          return true;
        }
      }
      return false;
    } catch (_error) {
      return false;
    }
  }

  private fullyResolvedPath(pathToCheck: string): string {
    try {
      return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
    } catch (e: unknown) {
      if (isNodeError(e) && e.code === 'ENOENT' && e.path && !this.isFileSymlink(e.path)) {
        return e.path;
      }
      throw e;
    }
  }

  private isPathWithinRoot(pathToCheck: string, rootDirectory: string): boolean {
    const relative = path.relative(rootDirectory, pathToCheck);
    return !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
  }

  private isFileSymlink(filePath: string): boolean {
    try {
      return !fs.readlinkSync(filePath).endsWith('/');
    } catch (_error) {
      return false;
    }
  }
}

// Usage in tools
class ReadFileTool {
  constructor(private workspace: WorkspaceContext) {}

  async execute(params: { file_path: string }) {
    const resolvedPath = path.resolve(params.file_path);

    if (!this.workspace.isPathWithinWorkspace(resolvedPath)) {
      throw new Error(`Path outside workspace: ${resolvedPath}`);
    }

    return fs.readFileSync(resolvedPath, 'utf-8');
  }
}
```

**Example explained:**

- Lines 1-12: Imports and class setup
- Lines 14-27: Main validation method with error handling
- Lines 29-43: Path resolution handling non-existent files and symlinks
- Lines 45-54: Containment check using relative path calculation
- Lines 56-63: Symlink type detection (file vs directory)
- Lines 65-80: Integration example in a file tool

### When to Use

**Use this pattern when:**

- Implementing file operations (read, write, edit, delete)
- Accepting user-provided file paths
- Operating in multi-directory workspace
- Security is a concern (prevent directory traversal attacks)
- Handling symbolic links that may escape workspace

**Avoid this pattern when:**

- No security requirements (internal tools, trusted environment)
- Single directory with no boundary concerns
- Performance-critical hot path (validation has overhead)
- Validation handled at higher layer (e.g., framework does it)

### Benefits

- **Security**: Prevents directory traversal attacks
- **Symlink Safe**: Resolves symlinks to real paths before checking
- **Non-existent Paths**: Validates paths that don't exist yet (for creation)
- **Multi-directory Support**: Checks against all workspace directories
- **Graceful Errors**: Returns false instead of throwing on circular symlinks

### Trade-offs

- **Performance**: File system operations (realpath, readlink) on every check
- **Complexity**: Symlink handling adds edge cases
- **Platform Differences**: Symlinks behave differently on Windows
- **False Negatives**: Circular symlinks always rejected (may be legitimate)

### Common Mistakes

**Mistake 1: Simple string prefix checking**

Bad example:

```typescript
isPathWithinWorkspace(pathToCheck: string): boolean {
  const absolutePath = path.resolve(pathToCheck);
  for (const dir of this.directories) {
    if (absolutePath.startsWith(dir)) {
      return true; // Vulnerable to attacks
    }
  }
  return false;
}
```

Correct approach:

```typescript
isPathWithinWorkspace(pathToCheck: string): boolean {
  const fullyResolvedPath = this.fullyResolvedPath(pathToCheck);
  for (const dir of this.directories) {
    if (this.isPathWithinRoot(fullyResolvedPath, dir)) {
      return true;
    }
  }
  return false;
}
```

**Why this matters**: String prefix checking is vulnerable to attacks like `/workspace-evil` passing the check for `/workspace`. Using `path.relative` is secure.

**Mistake 2: Not resolving symlinks before validation**

Bad example:

```typescript
isPathWithinWorkspace(pathToCheck: string): boolean {
  const absolutePath = path.resolve(pathToCheck); // Doesn't resolve symlinks
  // Validation...
}
```

Correct approach:

```typescript
isPathWithinWorkspace(pathToCheck: string): boolean {
  const fullyResolvedPath = this.fullyResolvedPath(pathToCheck); // Resolves symlinks
  // Validation...
}
```

**Why this matters**: Symlinks can point outside workspace. Without resolution, an attacker can create a symlink inside workspace pointing to `/etc/passwd` and bypass validation.

### Testing Strategy

**What to Test:**

- Valid paths within workspace directories
- Invalid paths outside workspace
- Non-existent paths within/outside workspace
- Symlinks pointing inside workspace
- Symlinks pointing outside workspace
- Circular symlinks (graceful failure)
- Edge cases (root, parent references)

**Test Organization:**

- Use real file system with temp directories
- Group tests by scenario (valid, invalid, symlinks, edge cases)
- Skip symlink tests on Windows (platform differences)

**Mock Strategy:**

- Use real file system operations (not mocked)
- Create actual symlinks for testing
- Use temp directories for isolation

**Test Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { WorkspaceContext } from './workspaceContext.js';

describe('WorkspaceContext - Path Validation', () => {
  let tempDir: string;
  let cwd: string;
  let otherDir: string;

  beforeEach(() => {
    tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-path-test-')));
    cwd = path.join(tempDir, 'project');
    otherDir = path.join(tempDir, 'other-project');

    fs.mkdirSync(cwd, { recursive: true });
    fs.mkdirSync(otherDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('valid paths', () => {
    it('should accept paths within workspace directories', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd, [otherDir]);
      const validPath1 = path.join(cwd, 'src', 'file.ts');
      const validPath2 = path.join(otherDir, 'lib', 'module.js');

      // Create files
      fs.mkdirSync(path.dirname(validPath1), { recursive: true });
      fs.writeFileSync(validPath1, 'content');
      fs.mkdirSync(path.dirname(validPath2), { recursive: true });
      fs.writeFileSync(validPath2, 'content');

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(validPath1)).toBe(true);
      expect(workspace.isPathWithinWorkspace(validPath2)).toBe(true);
    });

    it('should accept non-existent paths within workspace', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);
      const nonExistentPath = path.join(cwd, 'does-not-exist.txt');

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(nonExistentPath)).toBe(true);
    });
  });

  describe('invalid paths', () => {
    it('should reject paths outside workspace', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);
      const invalidPath = path.join(tempDir, 'outside', 'file.txt');

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(invalidPath)).toBe(false);
    });

    it('should reject parent directory', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);
      const parentPath = path.dirname(cwd);

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(parentPath)).toBe(false);
    });
  });

  describe.skipIf(os.platform() === 'win32')('symlinks', () => {
    it('should accept symlink to directory inside workspace', () => {
      // Arrange
      const realDir = path.join(cwd, 'real-dir');
      fs.mkdirSync(realDir, { recursive: true });
      const symlinkDir = path.join(cwd, 'symlink-dir');
      fs.symlinkSync(realDir, symlinkDir, 'dir');

      const workspace = new WorkspaceContext(cwd);

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(symlinkDir)).toBe(true);
    });

    it('should reject symlink to directory outside workspace', () => {
      // Arrange
      const realDir = path.join(tempDir, 'real-dir');
      fs.mkdirSync(realDir, { recursive: true });
      const symlinkDir = path.join(cwd, 'symlink-dir');
      fs.symlinkSync(realDir, symlinkDir, 'dir');

      const workspace = new WorkspaceContext(cwd);

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(symlinkDir)).toBe(false);
    });

    it('should reject symlink to file outside workspace', () => {
      // Arrange
      const realFile = path.join(tempDir, 'real-file.txt');
      fs.writeFileSync(realFile, 'content');
      const symlinkFile = path.join(cwd, 'symlink-file');
      fs.symlinkSync(realFile, symlinkFile, 'file');

      const workspace = new WorkspaceContext(cwd);

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(symlinkFile)).toBe(false);
    });

    it('should handle circular symlinks gracefully', () => {
      // Arrange
      const workspace = new WorkspaceContext(cwd);
      const linkA = path.join(cwd, 'link-a');
      const linkB = path.join(cwd, 'link-b');
      fs.symlinkSync(linkB, linkA, 'dir');
      fs.symlinkSync(linkA, linkB, 'dir');

      // Act & Assert
      expect(workspace.isPathWithinWorkspace(linkA)).toBe(false);
      expect(workspace.isPathWithinWorkspace(linkB)).toBe(false);
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 95%+
- Branch coverage: 90%+ (symlink branches platform-specific)
- Function coverage: 100%

### Related Patterns

- **[Error Handling](./04-error-handling-patterns.md)** - Graceful handling of fs errors
- **[Type Guards](./03-type-safety-patterns.md#type-guards)** - `isNodeError` for error narrowing
- **[File Filtering](./13-file-filtering.md)** - Uses containment validation

---

## Pattern 4: Symlink Resolution

### Intent

Safely resolve symbolic links to their real paths while handling edge cases like non-existent targets and circular references.

### Problem

Symbolic links can point anywhere on the file system, including outside workspace boundaries. Standard `fs.realpathSync()` throws errors for non-existent paths and circular symlinks. File operations need to validate symlink targets before allowing access. Directory symlinks vs file symlinks require different handling.

### Solution

Wrap `fs.realpathSync()` with error handling. For non-existent paths, extract the resolved path from the error object. Detect circular symlinks via ELOOP error and return false gracefully. Distinguish file symlinks from directory symlinks using `fs.readlinkSync()` output.

### Structure

```typescript
export class WorkspaceContext {
  private fullyResolvedPath(pathToCheck: string): string {
    try {
      return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
    } catch (e: unknown) {
      if (isNodeError(e) && e.code === 'ENOENT' && e.path && !this.isFileSymlink(e.path)) {
        return e.path; // Non-existent directory symlink
      }
      throw e; // Circular or other error
    }
  }

  private isFileSymlink(filePath: string): boolean {
    try {
      return !fs.readlinkSync(filePath).endsWith('/');
    } catch {
      return false;
    }
  }
}
```

### Implementation

**Step 1: Wrap realpathSync with error handling**

```typescript
import { isNodeError } from '../utils/errors.js';

private fullyResolvedPath(pathToCheck: string): string {
  try {
    // Resolve relative to targetDir
    const absolutePath = path.resolve(this.targetDir, pathToCheck);
    // Follow symlinks to real path
    return fs.realpathSync(absolutePath);
  } catch (e: unknown) {
    // Handle errors in next step
    throw e;
  }
}
```

**Step 2: Handle non-existent paths**

```typescript
private fullyResolvedPath(pathToCheck: string): string {
  try {
    return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  } catch (e: unknown) {
    if (isNodeError(e) && e.code === 'ENOENT') {
      // Path doesn't exist
      // realpathSync sets e.path to the fully resolved path
      if (e.path && !this.isFileSymlink(e.path)) {
        return e.path; // Use resolved path from error
      }
    }
    throw e; // Other errors (ELOOP, EACCES, etc.)
  }
}
```

**Step 3: Detect file vs directory symlinks**

```typescript
private isFileSymlink(filePath: string): boolean {
  try {
    const target = fs.readlinkSync(filePath);
    // Directory symlinks end with '/' on Unix
    return !target.endsWith('/');
  } catch (_error) {
    // Not a symlink or error reading
    return false;
  }
}
```

### Complete Example

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';
import { isNodeError } from '../utils/errors.js';

export class WorkspaceContext {
  constructor(
    readonly targetDir: string,
    additionalDirectories: string[] = []
  ) {
    // ... initialization ...
  }

  /**
   * Fully resolves a path, including symbolic links.
   * If the path does not exist, it returns the fully resolved path as it would be
   * if it did exist.
   */
  private fullyResolvedPath(pathToCheck: string): string {
    try {
      return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
    } catch (e: unknown) {
      if (
        isNodeError(e) &&
        e.code === 'ENOENT' &&
        e.path &&
        // realpathSync does not set e.path correctly for symlinks to
        // non-existent files.
        !this.isFileSymlink(e.path)
      ) {
        // If it doesn't exist, e.path contains the fully resolved path.
        return e.path;
      }
      throw e; // Circular symlink (ELOOP) or other error
    }
  }

  /**
   * Checks if a file path is a symbolic link that points to a file.
   */
  private isFileSymlink(filePath: string): boolean {
    try {
      return !fs.readlinkSync(filePath).endsWith('/');
    } catch (_error) {
      return false;
    }
  }
}

// Usage example
const workspace = new WorkspaceContext('/project');

// Non-existent path
const resolved1 = workspace['fullyResolvedPath']('/project/does-not-exist.txt');
// Returns: '/project/does-not-exist.txt'

// Symlink to existing directory
const resolved2 = workspace['fullyResolvedPath']('/project/symlink-to-dir');
// Returns: '/project/real-dir' (follows symlink)

// Circular symlink
try {
  workspace['fullyResolvedPath']('/project/circular-symlink');
} catch (e) {
  // Throws error (ELOOP)
}
```

**Example explained:**

- Lines 1-10: Imports and class setup
- Lines 12-34: Path resolution with non-existent path handling
- Lines 36-43: Symlink type detection using readlinkSync
- Lines 45-60: Usage examples showing different scenarios

### When to Use

**Use this pattern when:**

- Validating paths that may be symlinks
- Supporting non-existent paths (for creation operations)
- Preventing symlink-based directory traversal attacks
- Working with file systems that use symlinks heavily

**Avoid this pattern when:**

- Symlinks not supported (e.g., Windows without admin)
- Performance-critical hot path (resolution has overhead)
- Paths guaranteed to be real (no symlinks)
- Higher-level framework handles symlink resolution

### Benefits

- **Security**: Resolves symlinks before validation
- **Non-existent Paths**: Handles paths that don't exist yet
- **Circular Symlink Safety**: Gracefully handles circular references
- **Accurate Deduplication**: Same directory via different symlinks resolved to one

### Trade-offs

- **Performance**: Multiple file system calls per path
- **Platform Differences**: Symlink behavior varies (Windows, macOS, Linux)
- **Error Handling Complexity**: Multiple error codes to handle
- **Potential False Negatives**: Some legitimate paths may be rejected

### Common Mistakes

**Mistake 1: Not handling ENOENT errors**

Bad example:

```typescript
private fullyResolvedPath(pathToCheck: string): string {
  return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  // Throws on non-existent paths
}
```

Correct approach:

```typescript
private fullyResolvedPath(pathToCheck: string): string {
  try {
    return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  } catch (e: unknown) {
    if (isNodeError(e) && e.code === 'ENOENT' && e.path) {
      return e.path; // Return resolved path from error
    }
    throw e;
  }
}
```

**Why this matters**: File creation operations need to validate non-existent paths. Without handling ENOENT, validation fails for legitimate create operations.

**Mistake 2: Not distinguishing file vs directory symlinks**

Bad example:

```typescript
private fullyResolvedPath(pathToCheck: string): string {
  try {
    return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  } catch (e: unknown) {
    if (isNodeError(e) && e.code === 'ENOENT' && e.path) {
      return e.path; // Incorrect for file symlinks
    }
    throw e;
  }
}
```

Correct approach:

```typescript
private fullyResolvedPath(pathToCheck: string): string {
  try {
    return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  } catch (e: unknown) {
    if (isNodeError(e) && e.code === 'ENOENT' && e.path && !this.isFileSymlink(e.path)) {
      return e.path;
    }
    throw e;
  }
}
```

**Why this matters**: File symlinks to non-existent files don't have `e.path` set correctly. Check symlink type before using `e.path`.

### Testing Strategy

**What to Test:**

- Existing paths resolved correctly
- Non-existent paths resolved correctly
- Directory symlinks followed
- File symlinks handled
- Circular symlinks throw or return false
- Error propagation for unexpected errors

**Test Organization:**

- Group symlink tests in separate describe block
- Skip symlink tests on Windows
- Use real file system with temp directories

**Mock Strategy:**

- Use real fs operations (not mocked)
- Create actual symlinks for testing
- Test both existent and non-existent targets

**Test Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { WorkspaceContext } from './workspaceContext.js';

describe('WorkspaceContext - Symlink Resolution', () => {
  let tempDir: string;
  let cwd: string;

  beforeEach(() => {
    tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-symlink-test-')));
    cwd = path.join(tempDir, 'project');
    fs.mkdirSync(cwd, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe.skipIf(os.platform() === 'win32')('symlink resolution', () => {
    it('should resolve directory symlinks to real paths', () => {
      // Arrange
      const realDir = path.join(cwd, 'real-dir');
      fs.mkdirSync(realDir, { recursive: true });
      const symlinkDir = path.join(cwd, 'symlink-dir');
      fs.symlinkSync(realDir, symlinkDir, 'dir');

      const workspace = new WorkspaceContext(cwd);

      // Act
      const resolved = (workspace as any).fullyResolvedPath(symlinkDir);

      // Assert
      expect(resolved).toBe(realDir);
    });

    it('should handle non-existent directory symlinks', () => {
      // Arrange
      const nonExistentDir = path.join(cwd, 'does-not-exist');
      const symlinkDir = path.join(cwd, 'symlink-to-nonexistent');
      fs.symlinkSync(nonExistentDir, symlinkDir, 'dir');

      const workspace = new WorkspaceContext(cwd);

      // Act
      const resolved = (workspace as any).fullyResolvedPath(symlinkDir);

      // Assert
      expect(resolved).toBe(nonExistentDir);
    });

    it('should throw for circular symlinks', () => {
      // Arrange
      const linkA = path.join(cwd, 'link-a');
      const linkB = path.join(cwd, 'link-b');
      fs.symlinkSync(linkB, linkA, 'dir');
      fs.symlinkSync(linkA, linkB, 'dir');

      const workspace = new WorkspaceContext(cwd);

      // Act & Assert
      expect(() => {
        (workspace as any).fullyResolvedPath(linkA);
      }).toThrow(); // ELOOP error
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+ (platform-specific code excluded)
- Branch coverage: 85%+
- Function coverage: 100%

### Related Patterns

- **[Error Handling](./04-error-handling-patterns.md#type-guards)** - Using type guards for error narrowing
- **[Path Containment](#pattern-3-path-containment-validation)** - Uses symlink resolution

---

## Quick Reference

### Pattern Summary Table

| Pattern                      | Use When                                   | Avoid When                  | Key Benefit                   |
| ---------------------------- | ------------------------------------------ | --------------------------- | ----------------------------- |
| Workspace Context Class      | Multi-directory task execution             | Single-directory operations | Centralized path management   |
| Observable Directory Changes | Multiple systems depend on workspace state | Static workspace            | Reactive updates              |
| Path Containment Validation  | User-provided file paths                   | Trusted internal paths      | Security boundary enforcement |
| Symlink Resolution           | Validating symlink paths                   | Symlinks not used           | Prevents directory traversal  |

### Code Snippets

**Workspace Context - Minimal Example:**

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';

export class WorkspaceContext {
  private directories = new Set<string>();

  constructor(
    readonly targetDir: string,
    additionalDirectories: string[] = []
  ) {
    this.addDirectory(targetDir);
    additionalDirectories.forEach((dir) => this.addDirectory(dir));
  }

  addDirectory(directory: string): void {
    const resolved = fs.realpathSync(path.resolve(this.targetDir, directory));
    this.directories.add(resolved);
  }

  getDirectories(): readonly string[] {
    return Array.from(this.directories);
  }

  isPathWithinWorkspace(pathToCheck: string): boolean {
    const resolved = fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
    for (const dir of this.directories) {
      const relative = path.relative(dir, resolved);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        return true;
      }
    }
    return false;
  }
}
```

**Observable Pattern - Minimal Example:**

```typescript
export type Unsubscribe = () => void;

export class WorkspaceContext {
  private listeners = new Set<() => void>();

  onDirectoriesChanged(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch (e) {
        console.error('Listener error:', e);
      }
    }
  }
}
```

**Path Validation - Minimal Example:**

```typescript
isPathWithinWorkspace(pathToCheck: string): boolean {
  try {
    const resolved = fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
    for (const dir of this.directories) {
      const relative = path.relative(dir, resolved);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
```

**Symlink Resolution - Minimal Example:**

```typescript
import { isNodeError } from '../utils/errors.js';

private resolveSymlink(pathToCheck: string): string {
  try {
    return fs.realpathSync(path.resolve(this.targetDir, pathToCheck));
  } catch (e: unknown) {
    if (isNodeError(e) && e.code === 'ENOENT' && e.path) {
      return e.path; // Non-existent path
    }
    throw e; // Circular or other error
  }
}
```

---

## Enforcement

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "NodeNext"
  }
}
```

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  }
}
```

**Testing Requirements:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "vitest": {
    "coverage": {
      "lines": 90,
      "statements": 90,
      "functions": 100,
      "branches": 85
    }
  }
}
```

---

## Related Patterns

- **[Service Pattern](./06-code-organization.md#service-pattern)** - WorkspaceContext is a service
- **[File Filtering](./13-file-filtering.md)** - Uses workspace context for boundary enforcement
- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Type guards and graceful degradation
- **[Observer Pattern](./02-architectural-design-patterns.md#observer-pattern)** - Change notification system
- **[Testing Patterns](./05-testing-patterns.md)** - Real file system testing with temp directories

---

## References

**Source Code Examples:**

- [workspaceContext.ts](../../examplecode/gemini/packages/core/src/utils/workspaceContext.ts) - Complete implementation
- [workspaceContext.test.ts](../../examplecode/gemini/packages/core/src/utils/workspaceContext.test.ts) - Comprehensive test suite
- [mockWorkspaceContext.ts](../../examplecode/gemini/packages/core/src/test-utils/mockWorkspaceContext.ts) - Mock for testing
- [read-file.ts](../../examplecode/gemini/packages/core/src/tools/read-file.ts:204) - Usage in file tool
- [write-file.ts](../../examplecode/gemini/packages/core/src/tools/write-file.ts:448) - Usage in write tool

**External Resources:**

- [Node.js fs.realpathSync](https://nodejs.org/api/fs.html#fsrealpathsyncpath-options) - Resolving symbolic links
- [Node.js path.relative](https://nodejs.org/api/path.html#pathrelativefrom-to) - Path containment checking
- [Observer Pattern](https://refactoring.guru/design-patterns/observer) - Classic observer pattern

**Further Reading:**

- [Directory Traversal Attacks](https://owasp.org/www-community/attacks/Path_Traversal) - Security context for path validation
- [Symbolic Links Security](https://www.kernel.org/doc/html/latest/admin-guide/sysctl/fs.html#protected-symlinks) - Symlink security considerations

---

## Changelog

- **2025-01-21**: Applied pattern template structure to workspace management documentation
- **2025-01-21**: Added comprehensive testing strategies for all patterns
- **2025-01-21**: Extracted complete implementation examples from source codebase
- **2025-01-21**: Added common mistakes and when to use/avoid sections
