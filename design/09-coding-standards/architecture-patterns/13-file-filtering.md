---
title: File Filtering Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - File Discovery Service
  - Tool Implementations
related_patterns:
  - ./06-code-organization.md#service-pattern
  - ./05-testing-patterns.md#integration-tests
---

# 13. File Filtering Patterns

> **Purpose**: Comprehensive file filtering patterns using gitignore-style rules, multi-level ignore files, binary detection, and high-performance directory traversal for large codebases.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Gitignore-Style Filtering](#pattern-1-gitignore-style-filtering)
- [Pattern 2: Multi-Level Ignore Files](#pattern-2-multi-level-ignore-files)
- [Pattern 3: Precedence-Based Filtering](#pattern-3-precedence-based-filtering)
- [Pattern 4: Binary File Detection](#pattern-4-binary-file-detection)
- [Pattern 5: High-Performance Directory Traversal](#pattern-5-high-performance-directory-traversal)
- [Pattern 6: Pattern-Based File Exclusions](#pattern-6-pattern-based-file-exclusions)
- [Quick Reference](#quick-reference)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

File filtering is critical for CLI tools that process large codebases. The system must efficiently discover files while respecting ignore rules, detecting binary files, and handling nested ignore patterns. A well-designed file filtering system provides gitignore compatibility, custom ignore files, precedence rules, and performance optimizations for large directory trees.

Proper file filtering involves multiple layers: pattern matching using standard gitignore syntax, multi-level ignore files with proper precedence, binary file detection to avoid processing non-text content, and optimized traversal strategies with caching for performance.

**Why file filtering matters:**

- Reduce processing time by skipping irrelevant files
- Respect user preferences through gitignore compatibility
- Prevent binary file corruption from text processing
- Handle large codebases (100k+ files) efficiently
- Support nested project structures with multiple ignore files

**In this document:**

- **Gitignore-Style Filtering** - Standard .gitignore pattern matching with full syntax support
- **Multi-Level Ignore Files** - Nested .gitignore files with directory-scoped rules
- **Precedence-Based Filtering** - Custom ignore files that override or extend .gitignore
- **Binary File Detection** - Content-based and extension-based binary detection
- **High-Performance Directory Traversal** - Optimized crawling with caching and fuzzy search
- **Pattern-Based File Exclusions** - Predefined pattern sets for common exclusions

**Prerequisites:**

- Understanding of glob patterns and gitignore syntax
- Familiarity with Node.js file system operations
- Knowledge of service pattern architecture

---

## Pattern 1: Gitignore-Style Filtering

### Intent

Implement full .gitignore syntax support for filtering files with pattern matching, negation, anchoring, and directory-specific rules.

### Problem

CLI tools need to filter files based on user preferences expressed in .gitignore files. The .gitignore format is complex with special syntax for anchoring patterns to directories, negating patterns, handling comments, and supporting wildcards. Incomplete implementations lead to incorrect filtering behavior that surprises users.

### Solution

Use the `ignore` npm package to parse and apply .gitignore patterns with full syntax support. Process patterns to handle anchoring, negation, and nested .gitignore files. Maintain a cache of parsed patterns per directory and normalize paths for cross-platform compatibility.

### Structure

```typescript
interface GitIgnoreFilter {
  isIgnored(filePath: string): boolean;
}

class GitIgnoreParser implements GitIgnoreFilter {
  private projectRoot: string;
  private cache: Map<string, string[]>;

  constructor(projectRoot: string, extraPatterns?: string[]) {
    // Initialize with optional extra patterns
  }

  private processPatterns(rawPatterns: string[], baseDir: string): string[];
  private loadPatternsForFile(gitignorePath: string): string[];
  isIgnored(filePath: string): boolean;
}
```

### Implementation

**Step 1: Create GitIgnoreParser class with pattern caching**

```typescript
import ignore, { type Ignore } from 'ignore';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface GitIgnoreFilter {
  isIgnored(filePath: string): boolean;
}

export class GitIgnoreParser implements GitIgnoreFilter {
  private projectRoot: string;
  private cache: Map<string, string[]> = new Map();
  private globalPatterns: string[] | undefined;
  private processedExtraPatterns: string[] = [];

  constructor(
    projectRoot: string,
    private readonly extraPatterns?: string[]
  ) {
    this.projectRoot = path.resolve(projectRoot);
    if (this.extraPatterns) {
      this.processedExtraPatterns = this.processPatterns(this.extraPatterns, '.');
    }
  }
}
```

**Step 2: Implement pattern processing with anchoring and negation**

```typescript
private processPatterns(
  rawPatterns: string[],
  relativeBaseDir: string,
): string[] {
  return rawPatterns
    .map((p) => p.trimStart())
    .filter((p) => p !== '' && !p.startsWith('#'))
    .map((p) => {
      const isNegative = p.startsWith('!');
      if (isNegative) {
        p = p.substring(1);
      }

      const isAnchoredInFile = p.startsWith('/');
      if (isAnchoredInFile) {
        p = p.substring(1);
      }

      if (p === '') {
        return '';
      }

      let newPattern = p;

      // Handle nested .gitignore files
      if (relativeBaseDir && relativeBaseDir !== '.') {
        if (!isAnchoredInFile && !p.includes('/')) {
          newPattern = path.posix.join('**', p);
        }
        newPattern = path.posix.join(relativeBaseDir, newPattern);
        if (!newPattern.startsWith('/')) {
          newPattern = '/' + newPattern;
        }
      }

      if (isAnchoredInFile && !newPattern.startsWith('/')) {
        newPattern = '/' + newPattern;
      }

      if (isNegative) {
        newPattern = '!' + newPattern;
      }

      return newPattern;
    })
    .filter((p) => p !== '');
}
```

**Step 3: Load patterns from .gitignore file**

```typescript
private loadPatternsForFile(gitignorePath: string): string[] {
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const relativeBaseDir = path.posix.relative(
    this.projectRoot,
    path.dirname(gitignorePath),
  );

  return this.processPatterns(
    content.split(/\r?\n/),
    relativeBaseDir,
  );
}
```

**Step 4: Implement isIgnored with multi-source pattern loading**

```typescript
isIgnored(filePath: string): boolean {
  const absolutePath = path.resolve(this.projectRoot, filePath);
  const relativePath = path.relative(this.projectRoot, absolutePath);

  // Normalize for cross-platform compatibility
  const normalizedPath = relativePath.replace(/\\/g, '/');

  const ig = ignore();

  // Always ignore .git directory
  ig.add('.git');

  // Load global patterns from .git/info/exclude
  if (this.globalPatterns === undefined) {
    const excludeFile = path.join(
      this.projectRoot,
      '.git',
      'info',
      'exclude',
    );
    this.globalPatterns = fs.existsSync(excludeFile)
      ? this.loadPatternsForFile(excludeFile)
      : [];
  }
  ig.add(this.globalPatterns);

  // Collect all directories in the path for nested .gitignore support
  const pathParts = relativePath.split(path.sep);
  const dirsToVisit: string[] = [this.projectRoot];

  for (let i = 0; i < pathParts.length - 1; i++) {
    const currentDir = path.join(
      this.projectRoot,
      ...pathParts.slice(0, i + 1),
    );
    dirsToVisit.push(currentDir);
  }

  // Load patterns from each directory's .gitignore
  for (const dir of dirsToVisit) {
    if (this.cache.has(dir)) {
      const patterns = this.cache.get(dir);
      if (patterns) {
        ig.add(patterns);
      }
    } else {
      const gitignorePath = path.join(dir, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const patterns = this.loadPatternsForFile(gitignorePath);
        this.cache.set(dir, patterns);
        ig.add(patterns);
      }
    }
  }

  // Apply extra patterns last for highest precedence
  if (this.processedExtraPatterns.length > 0) {
    ig.add(this.processedExtraPatterns);
  }

  return ig.ignores(normalizedPath);
}
```

### Complete Example

```typescript
import ignore, { type Ignore } from 'ignore';
import * as fs from 'node:fs';
import * as path from 'node:path';

// packages/core/src/utils/gitIgnoreParser.ts

interface GitIgnoreFilter {
  isIgnored(filePath: string): boolean;
}

export class GitIgnoreParser implements GitIgnoreFilter {
  private projectRoot: string;
  private cache: Map<string, string[]> = new Map();
  private globalPatterns: string[] | undefined;
  private processedExtraPatterns: string[] = [];

  constructor(
    projectRoot: string,
    private readonly extraPatterns?: string[]
  ) {
    this.projectRoot = path.resolve(projectRoot);
    if (this.extraPatterns) {
      this.processedExtraPatterns = this.processPatterns(this.extraPatterns, '.');
    }
  }

  private processPatterns(rawPatterns: string[], relativeBaseDir: string): string[] {
    return rawPatterns
      .map((p) => p.trimStart())
      .filter((p) => p !== '' && !p.startsWith('#'))
      .map((p) => {
        const isNegative = p.startsWith('!');
        if (isNegative) {
          p = p.substring(1);
        }

        const isAnchoredInFile = p.startsWith('/');
        if (isAnchoredInFile) {
          p = p.substring(1);
        }

        if (p === '') {
          return '';
        }

        let newPattern = p;

        if (relativeBaseDir && relativeBaseDir !== '.') {
          if (!isAnchoredInFile && !p.includes('/')) {
            newPattern = path.posix.join('**', p);
          }
          newPattern = path.posix.join(relativeBaseDir, newPattern);
          if (!newPattern.startsWith('/')) {
            newPattern = '/' + newPattern;
          }
        }

        if (isAnchoredInFile && !newPattern.startsWith('/')) {
          newPattern = '/' + newPattern;
        }

        if (isNegative) {
          newPattern = '!' + newPattern;
        }

        return newPattern;
      })
      .filter((p) => p !== '');
  }

  private loadPatternsForFile(gitignorePath: string): string[] {
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const relativeBaseDir = path.posix.relative(this.projectRoot, path.dirname(gitignorePath));

    return this.processPatterns(content.split(/\r?\n/), relativeBaseDir);
  }

  isIgnored(filePath: string): boolean {
    const absolutePath = path.resolve(this.projectRoot, filePath);
    const relativePath = path.relative(this.projectRoot, absolutePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    const ig = ignore();
    ig.add('.git');

    if (this.globalPatterns === undefined) {
      const excludeFile = path.join(this.projectRoot, '.git', 'info', 'exclude');
      this.globalPatterns = fs.existsSync(excludeFile) ? this.loadPatternsForFile(excludeFile) : [];
    }
    ig.add(this.globalPatterns);

    const pathParts = relativePath.split(path.sep);
    const dirsToVisit: string[] = [this.projectRoot];

    for (let i = 0; i < pathParts.length - 1; i++) {
      const currentDir = path.join(this.projectRoot, ...pathParts.slice(0, i + 1));
      dirsToVisit.push(currentDir);
    }

    for (const dir of dirsToVisit) {
      if (this.cache.has(dir)) {
        const patterns = this.cache.get(dir);
        if (patterns) {
          ig.add(patterns);
        }
      } else {
        const gitignorePath = path.join(dir, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
          const patterns = this.loadPatternsForFile(gitignorePath);
          this.cache.set(dir, patterns);
          ig.add(patterns);
        }
      }
    }

    if (this.processedExtraPatterns.length > 0) {
      ig.add(this.processedExtraPatterns);
    }

    return ig.ignores(normalizedPath);
  }
}

// Usage
const parser = new GitIgnoreParser('/project/root');

console.log(parser.isIgnored('node_modules/package/index.js')); // true
console.log(parser.isIgnored('src/index.ts')); // false
console.log(parser.isIgnored('.git/config')); // true
```

**Example explained:**

- Lines 1-28: Class structure with caching and extra pattern support
- Lines 30-72: Pattern processing handles anchoring, negation, and nested directories
- Lines 74-89: Pattern loading from .gitignore files with caching
- Lines 91-143: Main isIgnored method with multi-source pattern loading and precedence

### When to Use

**Use gitignore-style filtering when:**

- Building developer tools that process project files
- Need to respect user's existing .gitignore configuration
- Supporting nested project structures with multiple .gitignore files
- Require standard glob pattern syntax with negation support

**Avoid this pattern when:**

- Simple extension-based filtering is sufficient
- Performance is critical and simpler filtering suffices
- No need for gitignore compatibility

### Benefits

- **Standard Syntax**: Users already familiar with .gitignore patterns
- **Full Feature Support**: Anchoring, negation, comments, wildcards all work correctly
- **Nested Support**: Handles multiple .gitignore files in directory hierarchy
- **Performance**: Pattern caching reduces file system reads
- **Cross-Platform**: Path normalization works on Windows and Unix

### Trade-offs

- **Complexity**: Full .gitignore syntax requires complex parsing
- **Memory Usage**: Caching patterns for many directories uses memory
- **Initial Cost**: First isIgnored call per directory loads and parses .gitignore

### Common Mistakes

**Mistake 1: Not normalizing paths for cross-platform compatibility**

Bad example:

```typescript
isIgnored(filePath: string): boolean {
  // Windows paths with backslashes won't match POSIX patterns
  return ig.ignores(filePath);
}
```

Correct approach:

```typescript
isIgnored(filePath: string): boolean {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return ig.ignores(normalizedPath);
}
```

**Why this matters**: The `ignore` package expects POSIX-style paths with forward slashes. Windows paths with backslashes will not match patterns correctly.

**Mistake 2: Not handling nested .gitignore pattern anchoring**

Bad example:

```typescript
// Treats all patterns as root-anchored
private processPatterns(patterns: string[]): string[] {
  return patterns.filter(p => p && !p.startsWith('#'));
}
```

Correct approach:

```typescript
private processPatterns(
  rawPatterns: string[],
  relativeBaseDir: string,
): string[] {
  // Handle anchored patterns relative to .gitignore location
  // Unanchored patterns become **/<pattern> for nested files
}
```

**Why this matters**: Patterns in nested .gitignore files should be anchored to the directory containing the .gitignore, not the project root.

### Testing Strategy

**What to Test:**

- Standard .gitignore patterns (wildcards, directories, anchoring)
- Negation patterns with exclamation mark
- Nested .gitignore files with proper scoping
- Comments and blank lines are ignored
- Pattern precedence (.git/info/exclude, .gitignore, extra patterns)
- Cross-platform path handling

**Test Organization:**

- Co-locate: `gitIgnoreParser.ts` → `gitIgnoreParser.test.ts`
- Use AAA pattern
- Create temporary directories for file system tests
- Clean up temp directories in afterEach

**Mock Strategy:**

- Use real file system with temporary directories
- No mocking needed for file operations in integration tests
- Mock file system for unit tests of pattern processing

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { GitIgnoreParser } from './gitIgnoreParser.js';

describe('GitIgnoreParser', () => {
  let projectRoot: string;
  let parser: GitIgnoreParser;

  beforeEach(async () => {
    // Create temporary project directory
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'gitignore-test-'));
    parser = new GitIgnoreParser(projectRoot);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  async function createTestFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(projectRoot, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  // Happy path - basic pattern matching
  it('should ignore files matching basic patterns', async () => {
    // Arrange
    await createTestFile('.gitignore', '*.log\nnode_modules/\n');

    // Act & Assert
    expect(parser.isIgnored('debug.log')).to.be.true;
    expect(parser.isIgnored('node_modules/package/index.js')).to.be.true;
    expect(parser.isIgnored('src/index.ts')).to.be.false;
  });

  // Negation patterns
  it('should handle negation patterns correctly', async () => {
    // Arrange
    await createTestFile('.gitignore', '*.txt\n!important.txt\n');

    // Act & Assert
    expect(parser.isIgnored('file.txt')).to.be.true;
    expect(parser.isIgnored('important.txt')).to.be.false;
  });

  // Nested .gitignore files
  it('should handle nested .gitignore files correctly', async () => {
    // Arrange
    await createTestFile('.gitignore', 'root-ignored.txt');
    await createTestFile('sub/.gitignore', '/local\n*.tmp');

    // Act & Assert
    expect(parser.isIgnored('root-ignored.txt')).to.be.true;
    expect(parser.isIgnored('sub/root-ignored.txt')).to.be.true;
    expect(parser.isIgnored('sub/local')).to.be.true;
    expect(parser.isIgnored('sub/deep/local')).to.be.false; // Anchored
    expect(parser.isIgnored('sub/file.tmp')).to.be.true;
    expect(parser.isIgnored('sub/deep/file.tmp')).to.be.true;
  });

  // Extra patterns precedence
  it('should apply extra patterns with highest precedence', async () => {
    // Arrange
    await createTestFile('.gitignore', '*.txt');
    const extraPatterns = ['!important.txt', 'temp/'];
    parser = new GitIgnoreParser(projectRoot, extraPatterns);

    // Act & Assert
    expect(parser.isIgnored('file.txt')).to.be.true;
    expect(parser.isIgnored('important.txt')).to.be.false; // Un-ignored by extra
    expect(parser.isIgnored('temp/file.js')).to.be.true; // Added by extra
  });

  // Edge case - escaped characters
  it('should handle escaped characters in patterns', async () => {
    // Arrange
    await createTestFile('.gitignore', '\\#foo\n\\!bar');

    // Act & Assert
    expect(parser.isIgnored('#foo')).to.be.true;
    expect(parser.isIgnored('!bar')).to.be.true;
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Branch coverage: 85%+
- Test all pattern types (wildcards, anchoring, negation)
- Test nested .gitignore scenarios
- Test cross-platform path handling

### Related Patterns

- **[Service Pattern](./06-code-organization.md#service-pattern)** - GitIgnoreParser is implemented as a service
- **[Caching Pattern](./14-performance.md#caching)** - Pattern caching for performance
- **[Multi-Level Ignore Files](#pattern-2-multi-level-ignore-files)** - Extends this pattern with custom ignore files

---

## Pattern 2: Multi-Level Ignore Files

### Intent

Support multiple ignore file types with clear precedence rules, allowing custom ignore files to extend or override .gitignore patterns.

### Problem

Different tools need different file filtering rules. A project may want to use .gitignore for version control but have additional exclusions for AI tools, linters, or build systems. Users need a way to layer ignore rules without modifying .gitignore, with clear precedence when patterns conflict.

### Solution

Create separate parser classes for each ignore file type (GitIgnoreParser, CustomIgnoreParser). Combine patterns using precedence rules where custom ignore files have the highest priority. Use a service layer to coordinate multiple parsers and provide a unified filtering interface.

### Structure

```typescript
interface FileFilter {
  isIgnored(filePath: string): boolean;
}

class CustomIgnoreParser implements FileFilter {
  constructor(projectRoot: string) {}
  isIgnored(filePath: string): boolean;
  getPatterns(): string[];
}

class FileDiscoveryService {
  private gitIgnoreFilter: GitIgnoreParser | null;
  private customIgnoreFilter: CustomIgnoreParser | null;
  private combinedIgnoreFilter: GitIgnoreParser | null;

  constructor(projectRoot: string) {
    // Initialize all parsers
    // Create combined parser with proper precedence
  }

  filterFiles(files: string[], options: FilterOptions): string[];
  shouldIgnoreFile(file: string, options: FilterOptions): boolean;
}
```

### Implementation

**Step 1: Create custom ignore file parser**

```typescript
import ignore, { type Ignore } from 'ignore';
import * as fs from 'node:fs';
import * as path from 'node:path';

// packages/core/src/utils/customIgnoreParser.ts

interface CustomIgnoreFilter {
  isIgnored(filePath: string): boolean;
  getPatterns(): string[];
}

export class CustomIgnoreParser implements CustomIgnoreFilter {
  private projectRoot: string;
  private patterns: string[] = [];
  private ig = ignore();

  constructor(projectRoot: string, ignoreFileName: string = '.customignore') {
    this.projectRoot = path.resolve(projectRoot);
    this.loadPatterns(ignoreFileName);
  }

  private loadPatterns(ignoreFileName: string): void {
    const patternsFilePath = path.join(this.projectRoot, ignoreFileName);
    let content: string;
    try {
      content = fs.readFileSync(patternsFilePath, 'utf-8');
    } catch (_error) {
      return; // File doesn't exist - that's okay
    }

    this.patterns = (content ?? '')
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p !== '' && !p.startsWith('#'));

    this.ig.add(this.patterns);
  }

  isIgnored(filePath: string): boolean {
    if (this.patterns.length === 0) {
      return false;
    }

    const absolutePath = path.resolve(this.projectRoot, filePath);
    const relativePath = path.relative(this.projectRoot, absolutePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    return this.ig.ignores(normalizedPath);
  }

  getPatterns(): string[] {
    return this.patterns;
  }
}
```

**Step 2: Create coordinating service with precedence**

```typescript
import * as path from 'node:path';
import { GitIgnoreParser } from '../utils/gitIgnoreParser.js';
import { CustomIgnoreParser } from '../utils/customIgnoreParser.js';

// packages/core/src/services/fileDiscoveryService.ts

export interface FilterFilesOptions {
  respectGitIgnore?: boolean;
  respectCustomIgnore?: boolean;
}

export interface FilterReport {
  filteredPaths: string[];
  ignoredCount: number;
}

function isGitRepository(projectRoot: string): boolean {
  const gitDir = path.join(projectRoot, '.git');
  return fs.existsSync(gitDir);
}

export class FileDiscoveryService {
  private gitIgnoreFilter: GitIgnoreParser | null = null;
  private customIgnoreFilter: CustomIgnoreParser | null = null;
  private combinedIgnoreFilter: GitIgnoreParser | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);

    // Initialize git ignore parser if .git exists
    if (isGitRepository(this.projectRoot)) {
      this.gitIgnoreFilter = new GitIgnoreParser(this.projectRoot);
    }

    // Initialize custom ignore parser
    this.customIgnoreFilter = new CustomIgnoreParser(this.projectRoot, '.customignore');

    // Create combined parser: .gitignore + .customignore
    // Custom patterns have higher precedence
    if (this.gitIgnoreFilter) {
      const customPatterns = this.customIgnoreFilter.getPatterns();
      this.combinedIgnoreFilter = new GitIgnoreParser(
        this.projectRoot,
        customPatterns // These take precedence
      );
    }
  }

  filterFiles(filePaths: string[], options: FilterFilesOptions = {}): string[] {
    const { respectGitIgnore = true, respectCustomIgnore = true } = options;

    return filePaths.filter((filePath) => {
      return !this.shouldIgnoreFile(filePath, {
        respectGitIgnore,
        respectCustomIgnore,
      });
    });
  }

  filterFilesWithReport(filePaths: string[], options: FilterFilesOptions = {}): FilterReport {
    const filteredPaths = this.filterFiles(filePaths, options);
    return {
      filteredPaths,
      ignoredCount: filePaths.length - filteredPaths.length,
    };
  }

  shouldIgnoreFile(filePath: string, options: FilterFilesOptions = {}): boolean {
    const { respectGitIgnore = true, respectCustomIgnore = true } = options;

    // Use combined filter if both are enabled
    if (respectGitIgnore && respectCustomIgnore && this.combinedIgnoreFilter) {
      return this.combinedIgnoreFilter.isIgnored(filePath);
    }

    // Use custom ignore only
    if (respectCustomIgnore && !respectGitIgnore) {
      return this.customIgnoreFilter?.isIgnored(filePath) ?? false;
    }

    // Use git ignore only
    if (respectGitIgnore && !respectCustomIgnore) {
      return this.gitIgnoreFilter?.isIgnored(filePath) ?? false;
    }

    // No filtering
    return false;
  }
}
```

### Complete Example

```typescript
// packages/core/src/services/fileDiscoveryService.ts
import * as path from 'node:path';
import * as fs from 'node:fs';
import { GitIgnoreParser } from '../utils/gitIgnoreParser.js';
import { CustomIgnoreParser } from '../utils/customIgnoreParser.js';

export interface FilterFilesOptions {
  respectGitIgnore?: boolean;
  respectCustomIgnore?: boolean;
}

export class FileDiscoveryService {
  private gitIgnoreFilter: GitIgnoreParser | null = null;
  private customIgnoreFilter: CustomIgnoreParser | null = null;
  private combinedIgnoreFilter: GitIgnoreParser | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);

    if (fs.existsSync(path.join(this.projectRoot, '.git'))) {
      this.gitIgnoreFilter = new GitIgnoreParser(this.projectRoot);
    }

    this.customIgnoreFilter = new CustomIgnoreParser(this.projectRoot, '.customignore');

    if (this.gitIgnoreFilter) {
      const customPatterns = this.customIgnoreFilter.getPatterns();
      this.combinedIgnoreFilter = new GitIgnoreParser(this.projectRoot, customPatterns);
    }
  }

  filterFiles(filePaths: string[], options: FilterFilesOptions = {}): string[] {
    return filePaths.filter((filePath) => {
      return !this.shouldIgnoreFile(filePath, options);
    });
  }

  shouldIgnoreFile(filePath: string, options: FilterFilesOptions = {}): boolean {
    const { respectGitIgnore = true, respectCustomIgnore = true } = options;

    if (respectGitIgnore && respectCustomIgnore && this.combinedIgnoreFilter) {
      return this.combinedIgnoreFilter.isIgnored(filePath);
    }

    if (respectCustomIgnore && !respectGitIgnore) {
      return this.customIgnoreFilter?.isIgnored(filePath) ?? false;
    }

    if (respectGitIgnore && !respectCustomIgnore) {
      return this.gitIgnoreFilter?.isIgnored(filePath) ?? false;
    }

    return false;
  }
}

// Usage
const service = new FileDiscoveryService('/project/root');

const files = ['src/index.ts', 'node_modules/package/index.js', 'dist/bundle.js', 'README.md'];

// Filter with both .gitignore and .customignore
const filtered = service.filterFiles(files);
console.log(filtered); // ['src/index.ts', 'README.md']

// Filter with only .gitignore
const gitOnly = service.filterFiles(files, {
  respectGitIgnore: true,
  respectCustomIgnore: false,
});

// Filter with only .customignore
const customOnly = service.filterFiles(files, {
  respectGitIgnore: false,
  respectCustomIgnore: true,
});
```

**Example explained:**

- Lines 1-17: Service initialization with multiple parsers
- Lines 19-41: Combined parser creation with precedence
- Lines 43-71: Flexible filtering with option-based parser selection
- Lines 73-90: Usage showing different filtering modes

### When to Use

**Use multi-level ignore files when:**

- Building tools that need tool-specific ignore rules
- Users want to extend .gitignore without modifying it
- Need different filtering rules for different operations
- Supporting multiple ignore file standards

**Avoid this pattern when:**

- Single .gitignore is sufficient
- No need for precedence rules
- Complexity outweighs benefits

### Benefits

- **Separation of Concerns**: Git rules separate from tool-specific rules
- **Non-Invasive**: Users don't modify .gitignore for tool-specific needs
- **Clear Precedence**: Custom patterns override git patterns predictably
- **Flexibility**: Can enable/disable each ignore file type independently

### Trade-offs

- **More Parsers**: Multiple parser instances use more memory
- **Precedence Complexity**: Users must understand override rules
- **Configuration**: More ignore files for users to maintain

### Common Mistakes

**Mistake 1: Incorrect precedence order**

Bad example:

```typescript
// Git patterns override custom patterns
const combinedFilter = new GitIgnoreParser(
  projectRoot,
  gitPatterns.concat(customPatterns) // Wrong order
);
```

Correct approach:

```typescript
// Custom patterns passed as extra patterns have highest precedence
const combinedFilter = new GitIgnoreParser(
  projectRoot,
  customPatterns // These override .gitignore
);
```

**Why this matters**: Users expect custom ignore files to override .gitignore, not the other way around.

**Mistake 2: Not handling missing ignore files gracefully**

Bad example:

```typescript
constructor(projectRoot: string) {
  this.gitIgnoreFilter = new GitIgnoreParser(projectRoot); // Crashes if .git missing
}
```

Correct approach:

```typescript
constructor(projectRoot: string) {
  if (fs.existsSync(path.join(projectRoot, '.git'))) {
    this.gitIgnoreFilter = new GitIgnoreParser(projectRoot);
  }
}
```

**Why this matters**: Not all projects are git repositories. Missing .git should not cause errors.

### Testing Strategy

**What to Test:**

- Both ignore files respected with correct precedence
- Custom patterns override git patterns
- Individual filtering (git only, custom only)
- Missing ignore files handled gracefully
- Negation patterns work across files

**Test Organization:**

- Co-locate: `fileDiscoveryService.ts` → `fileDiscoveryService.test.ts`
- Use temporary directories for file system state
- Test each precedence scenario explicitly

**Mock Strategy:**

- Use real file system with temporary directories
- Create .gitignore and .customignore files in tests
- No mocking for integration tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileDiscoveryService } from './fileDiscoveryService.js';

describe('FileDiscoveryService - Multi-Level Filtering', () => {
  let projectRoot: string;
  let service: FileDiscoveryService;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'filter-test-'));
    await fs.mkdir(path.join(projectRoot, '.git'));
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  async function createIgnoreFile(name: string, content: string): Promise<void> {
    await fs.writeFile(path.join(projectRoot, name), content, 'utf-8');
  }

  // Precedence test - custom overrides git
  it('should allow custom ignore to un-ignore git patterns', async () => {
    // Arrange
    await createIgnoreFile('.gitignore', '*.txt');
    await createIgnoreFile('.customignore', '!important.txt');
    service = new FileDiscoveryService(projectRoot);

    const files = ['file.txt', 'important.txt'].map((f) => path.join(projectRoot, f));

    // Act
    const filtered = service.filterFiles(files);

    // Assert
    expect(filtered).to.deep.equal([path.join(projectRoot, 'important.txt')]);
  });

  // Precedence test - custom extends git
  it('should allow custom ignore to extend git patterns', async () => {
    // Arrange
    await createIgnoreFile('.gitignore', '*.log');
    await createIgnoreFile('.customignore', 'temp/');
    service = new FileDiscoveryService(projectRoot);

    const files = ['app.log', 'temp/file.txt'].map((f) => path.join(projectRoot, f));

    // Act
    const filtered = service.filterFiles(files);

    // Assert - both filtered
    expect(filtered).to.deep.equal([]);
  });

  // Option-based filtering
  it('should respect filter options independently', async () => {
    // Arrange
    await createIgnoreFile('.gitignore', '*.log');
    await createIgnoreFile('.customignore', '*.tmp');
    service = new FileDiscoveryService(projectRoot);

    const files = ['app.log', 'file.tmp', 'code.ts'].map((f) => path.join(projectRoot, f));

    // Act - git ignore only
    const gitOnly = service.filterFiles(files, {
      respectGitIgnore: true,
      respectCustomIgnore: false,
    });

    // Act - custom ignore only
    const customOnly = service.filterFiles(files, {
      respectGitIgnore: false,
      respectCustomIgnore: true,
    });

    // Assert
    expect(gitOnly).to.deep.equal([
      path.join(projectRoot, 'file.tmp'),
      path.join(projectRoot, 'code.ts'),
    ]);
    expect(customOnly).to.deep.equal([
      path.join(projectRoot, 'app.log'),
      path.join(projectRoot, 'code.ts'),
    ]);
  });

  // Missing files handled gracefully
  it('should handle missing ignore files gracefully', async () => {
    // Arrange - no ignore files created
    service = new FileDiscoveryService(projectRoot);

    const files = ['file.txt'].map((f) => path.join(projectRoot, f));

    // Act
    const filtered = service.filterFiles(files);

    // Assert - no filtering applied
    expect(filtered).to.deep.equal(files);
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Branch coverage: 85%+
- Test all precedence combinations
- Test missing ignore files

### Related Patterns

- **[Gitignore-Style Filtering](#pattern-1-gitignore-style-filtering)** - Foundation for this pattern
- **[Service Pattern](./06-code-organization.md#service-pattern)** - FileDiscoveryService coordinates multiple parsers

---

## Pattern 3: Precedence-Based Filtering

### Intent

Establish clear precedence rules when multiple ignore sources conflict, ensuring predictable and user-friendly filtering behavior.

### Problem

When multiple ignore files or pattern sources exist (.gitignore, .git/info/exclude, custom ignore files, runtime patterns), conflicts arise. A file might be ignored by .gitignore but un-ignored by a custom ignore file. Without clear precedence rules, filtering behavior becomes unpredictable and confusing.

### Solution

Define explicit precedence hierarchy with custom patterns having highest priority, followed by custom ignore files, then .gitignore, then .git/info/exclude. Implement precedence by loading patterns in order and allowing later patterns to negate earlier ones using the `!` prefix.

### Structure

```typescript
// Precedence hierarchy (highest to lowest):
// 1. Runtime patterns (passed to constructor)
// 2. Custom ignore file (.customignore)
// 3. .gitignore files (nested)
// 4. .git/info/exclude

class GitIgnoreParser {
  constructor(
    projectRoot: string,
    extraPatterns?: string[] // Highest precedence
  ) {}
}

class FileDiscoveryService {
  private combinedFilter: GitIgnoreParser;

  constructor(projectRoot: string) {
    // Load in order: lowest to highest precedence
    // Extra patterns from custom ignore override everything
  }
}
```

### Implementation

**Step 1: Define precedence in GitIgnoreParser**

```typescript
// packages/core/src/utils/gitIgnoreParser.ts

export class GitIgnoreParser implements GitIgnoreFilter {
  private projectRoot: string;
  private cache: Map<string, string[]> = new Map();
  private globalPatterns: string[] | undefined;
  private processedExtraPatterns: string[] = [];

  constructor(
    projectRoot: string,
    private readonly extraPatterns?: string[] // HIGHEST precedence
  ) {
    this.projectRoot = path.resolve(projectRoot);
    if (this.extraPatterns) {
      this.processedExtraPatterns = this.processPatterns(this.extraPatterns, '.');
    }
  }

  isIgnored(filePath: string): boolean {
    const ig = ignore();

    // Load patterns in order: lowest to highest precedence

    // 1. Always ignore .git (system)
    ig.add('.git');

    // 2. Load .git/info/exclude (global git config)
    if (this.globalPatterns === undefined) {
      const excludeFile = path.join(this.projectRoot, '.git', 'info', 'exclude');
      this.globalPatterns = fs.existsSync(excludeFile) ? this.loadPatternsForFile(excludeFile) : [];
    }
    ig.add(this.globalPatterns);

    // 3. Load .gitignore files (project-specific, can be nested)
    for (const dir of dirsToVisit) {
      const gitignorePath = path.join(dir, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const patterns = this.loadPatternsForFile(gitignorePath);
        this.cache.set(dir, patterns);
        ig.add(patterns);
      }
    }

    // 4. Apply extra patterns (HIGHEST precedence)
    // These can negate earlier patterns with !
    if (this.processedExtraPatterns.length > 0) {
      ig.add(this.processedExtraPatterns);
    }

    return ig.ignores(normalizedPath);
  }
}
```

**Step 2: Implement precedence in FileDiscoveryService**

```typescript
// packages/core/src/services/fileDiscoveryService.ts

export class FileDiscoveryService {
  private gitIgnoreFilter: GitIgnoreParser | null = null;
  private customIgnoreFilter: CustomIgnoreParser | null = null;
  private combinedIgnoreFilter: GitIgnoreParser | null = null;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);

    // Initialize base git ignore filter
    if (isGitRepository(this.projectRoot)) {
      this.gitIgnoreFilter = new GitIgnoreParser(this.projectRoot);
    }

    // Initialize custom ignore filter
    this.customIgnoreFilter = new CustomIgnoreParser(this.projectRoot, '.customignore');

    // Create combined filter with precedence:
    // .gitignore (loaded by GitIgnoreParser internally)
    // + .customignore patterns (passed as extraPatterns)
    if (this.gitIgnoreFilter) {
      const customPatterns = this.customIgnoreFilter.getPatterns();

      // Custom patterns have highest precedence
      this.combinedIgnoreFilter = new GitIgnoreParser(
        this.projectRoot,
        customPatterns // These override .gitignore
      );
    }
  }
}
```

### Complete Example

```typescript
// Example: Custom ignore file un-ignores a .gitignore pattern

// .gitignore
// *.txt

// .customignore
// !important.txt
// critical.txt

import { FileDiscoveryService } from './services/fileDiscoveryService.js';

const service = new FileDiscoveryService('/project/root');

const files = [
  '/project/root/file.txt', // Ignored by .gitignore
  '/project/root/important.txt', // Ignored by .gitignore, un-ignored by .customignore
  '/project/root/critical.txt', // Ignored by .customignore
  '/project/root/README.md', // Not ignored
];

const filtered = service.filterFiles(files);

console.log(filtered);
// [
//   '/project/root/important.txt',  // Un-ignored by custom
//   '/project/root/README.md',      // Never ignored
// ]

// Precedence in action:
// - file.txt: .gitignore says ignore → IGNORED
// - important.txt: .gitignore says ignore, .customignore says !ignore → NOT IGNORED
// - critical.txt: .customignore says ignore → IGNORED
// - README.md: no patterns match → NOT IGNORED
```

**Example explained:**

- .gitignore pattern `*.txt` ignores all .txt files
- .customignore pattern `!important.txt` negates that for one file
- .customignore pattern `critical.txt` adds new ignore rule
- Precedence ensures custom patterns win

### When to Use

**Use precedence-based filtering when:**

- Multiple ignore file types must coexist
- Users need to override or extend existing ignore rules
- Tool-specific filtering must not modify .gitignore
- Clear conflict resolution is required

**Avoid this pattern when:**

- Single ignore file is sufficient
- No need for layered filtering
- Precedence adds unnecessary complexity

### Benefits

- **Predictable Behavior**: Clear hierarchy prevents confusion
- **Non-Destructive Overrides**: Can un-ignore files without modifying .gitignore
- **Extensibility**: New pattern sources slot into precedence hierarchy
- **User Control**: Users control precedence through file choice

### Trade-offs

- **Complexity**: Users must understand precedence rules
- **Documentation**: Requires explaining precedence to users
- **Debugging**: Harder to debug which pattern caused filtering

### Common Mistakes

**Mistake 1: Reversing precedence (git overrides custom)**

Bad example:

```typescript
// Load custom patterns first, git patterns last
ig.add(customPatterns);
ig.add(gitPatterns); // These override custom patterns (wrong!)
```

Correct approach:

```typescript
// Load git patterns first, custom patterns last
ig.add(gitPatterns);
ig.add(customPatterns); // These override git patterns (correct)
```

**Why this matters**: The `ignore` package applies patterns in order. Later patterns can negate earlier ones. Custom patterns must come last to override .gitignore.

**Mistake 2: Not documenting precedence for users**

Bad example:

```typescript
// No documentation of precedence
class FileDiscoveryService {
  constructor(projectRoot: string) {
    // Magic precedence buried in implementation
  }
}
```

Correct approach:

```typescript
/**
 * File filtering service with precedence hierarchy:
 *
 * 1. Runtime patterns (highest precedence)
 * 2. .customignore patterns
 * 3. .gitignore patterns (including nested)
 * 4. .git/info/exclude patterns
 *
 * Higher precedence patterns can negate lower precedence using !prefix
 *
 * Example:
 *   .gitignore: *.txt
 *   .customignore: !important.txt
 *   Result: important.txt is NOT ignored (custom overrides git)
 */
class FileDiscoveryService {
  // ...
}
```

**Why this matters**: Precedence is not intuitive. Users need explicit documentation to understand override behavior.

### Testing Strategy

**What to Test:**

- Custom patterns override git patterns
- Negation works across precedence levels
- All precedence levels work independently
- Missing files don't break precedence
- Complex precedence scenarios (nested + custom + git)

**Test Organization:**

- Focus on precedence edge cases
- Test each level of hierarchy independently
- Test interactions between levels

**Mock Strategy:**

- Use real file system with multiple ignore files
- Create comprehensive test scenarios
- No mocking for precedence tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileDiscoveryService } from './fileDiscoveryService.js';

describe('Precedence-Based Filtering', () => {
  let projectRoot: string;
  let service: FileDiscoveryService;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'precedence-test-'));
    await fs.mkdir(path.join(projectRoot, '.git'));
    await fs.mkdir(path.join(projectRoot, '.git', 'info'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  async function createFile(name: string, content: string): Promise<void> {
    await fs.writeFile(path.join(projectRoot, name), content, 'utf-8');
  }

  // Test complete precedence hierarchy
  it('should apply precedence hierarchy correctly', async () => {
    // Arrange - create all ignore file types
    await createFile('.git/info/exclude', 'exclude-pattern.txt');
    await createFile('.gitignore', 'git-pattern.txt\n*.log');
    await createFile('.customignore', 'custom-pattern.txt\n!special.log');

    service = new FileDiscoveryService(projectRoot);

    const files = [
      'exclude-pattern.txt', // Ignored by .git/info/exclude
      'git-pattern.txt', // Ignored by .gitignore
      'file.log', // Ignored by .gitignore
      'special.log', // Ignored by .gitignore, un-ignored by .customignore
      'custom-pattern.txt', // Ignored by .customignore
      'normal.txt', // Not ignored
    ].map((f) => path.join(projectRoot, f));

    // Act
    const filtered = service.filterFiles(files);

    // Assert
    expect(filtered).to.deep.equal([
      path.join(projectRoot, 'special.log'), // Custom un-ignored this
      path.join(projectRoot, 'normal.txt'), // Never ignored
    ]);
  });

  // Test custom negating git
  it('should allow custom to negate git ignore', async () => {
    // Arrange
    await createFile('.gitignore', '*.md');
    await createFile('.customignore', '!README.md\n!CHANGELOG.md');

    service = new FileDiscoveryService(projectRoot);

    const files = [
      'file.md', // Ignored by git
      'README.md', // Ignored by git, un-ignored by custom
      'CHANGELOG.md', // Ignored by git, un-ignored by custom
    ].map((f) => path.join(projectRoot, f));

    // Act
    const filtered = service.filterFiles(files);

    // Assert
    expect(filtered).to.deep.equal([
      path.join(projectRoot, 'README.md'),
      path.join(projectRoot, 'CHANGELOG.md'),
    ]);
  });

  // Test nested gitignore with custom override
  it('should handle nested gitignore with custom override', async () => {
    // Arrange
    await createFile('.gitignore', '*.tmp');
    await fs.mkdir(path.join(projectRoot, 'subdir'));
    await createFile('subdir/.gitignore', '*.log');
    await createFile('.customignore', '!subdir/important.log');

    service = new FileDiscoveryService(projectRoot);

    const files = [
      'file.tmp', // Ignored by root .gitignore
      'subdir/file.log', // Ignored by subdir .gitignore
      'subdir/important.log', // Ignored by subdir .gitignore, un-ignored by custom
    ].map((f) => path.join(projectRoot, f));

    // Act
    const filtered = service.filterFiles(files);

    // Assert
    expect(filtered).to.deep.equal([path.join(projectRoot, 'subdir/important.log')]);
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Branch coverage: 85%+
- Test all precedence levels
- Test precedence interactions
- Test negation across levels

### Related Patterns

- **[Multi-Level Ignore Files](#pattern-2-multi-level-ignore-files)** - Implements this precedence
- **[Gitignore-Style Filtering](#pattern-1-gitignore-style-filtering)** - Foundation pattern

---

## Pattern 4: Binary File Detection

### Intent

Detect binary files accurately to avoid processing them as text, preventing corruption and wasted processing time.

### Problem

Processing binary files as text causes corruption, crashes, or wasted resources. Extension-based detection is unreliable (files without extensions, wrong extensions). Content-based detection must be fast enough for large codebases while accurately identifying binary content including Unicode text with byte-order marks.

### Solution

Use multi-level detection: check for Unicode BOM first (indicates text), check extension against known binary list, then sample file content for null bytes or high proportion of non-printable characters. Limit sampling to 4KB for performance.

### Structure

```typescript
// BOM detection for Unicode files
type UnicodeEncoding = 'utf8' | 'utf16le' | 'utf16be' | 'utf32le' | 'utf32be';

interface BOMInfo {
  encoding: UnicodeEncoding;
  bomLength: number;
}

function detectBOM(buf: Buffer): BOMInfo | null;

// Binary file detection
async function isBinaryFile(filePath: string): Promise<boolean>;

// File type classification
type FileType = 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'svg';

async function detectFileType(filePath: string): Promise<FileType>;
```

### Implementation

**Step 1: Implement BOM detection**

```typescript
// packages/core/src/utils/fileUtils.ts

type UnicodeEncoding = 'utf8' | 'utf16le' | 'utf16be' | 'utf32le' | 'utf32be';

interface BOMInfo {
  encoding: UnicodeEncoding;
  bomLength: number;
}

export function detectBOM(buf: Buffer): BOMInfo | null {
  if (buf.length >= 4) {
    // UTF-32 LE: FF FE 00 00
    if (buf[0] === 0xff && buf[1] === 0xfe && buf[2] === 0x00 && buf[3] === 0x00) {
      return { encoding: 'utf32le', bomLength: 4 };
    }
    // UTF-32 BE: 00 00 FE FF
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0xfe && buf[3] === 0xff) {
      return { encoding: 'utf32be', bomLength: 4 };
    }
  }
  if (buf.length >= 3) {
    // UTF-8: EF BB BF
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      return { encoding: 'utf8', bomLength: 3 };
    }
  }
  if (buf.length >= 2) {
    // UTF-16 LE: FF FE
    if (
      buf[0] === 0xff &&
      buf[1] === 0xfe &&
      (buf.length < 4 || buf[2] !== 0x00 || buf[3] !== 0x00)
    ) {
      return { encoding: 'utf16le', bomLength: 2 };
    }
    // UTF-16 BE: FE FF
    if (buf[0] === 0xfe && buf[1] === 0xff) {
      return { encoding: 'utf16be', bomLength: 2 };
    }
  }
  return null;
}
```

**Step 2: Implement content-based binary detection**

```typescript
import * as fs from 'node:fs/promises';

export async function isBinaryFile(filePath: string): Promise<boolean> {
  let fh: fs.FileHandle | null = null;
  try {
    fh = await fs.open(filePath, 'r');
    const stats = await fh.stat();
    const fileSize = stats.size;

    // Empty file is text
    if (fileSize === 0) return false;

    // Sample up to 4KB from the head
    const sampleSize = Math.min(4096, fileSize);
    const buf = Buffer.alloc(sampleSize);
    const { bytesRead } = await fh.read(buf, 0, sampleSize, 0);

    if (bytesRead === 0) return false;

    // BOM → text (avoid false positives for UTF-16/32 with nulls)
    const bom = detectBOM(buf.subarray(0, Math.min(4, bytesRead)));
    if (bom) return false;

    // Check for null bytes (strong indicator of binary)
    let nonPrintableCount = 0;
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true; // Null byte = binary

      // Count non-printable characters (excluding tabs, newlines, etc.)
      if (buf[i] < 9 || (buf[i] > 13 && buf[i] < 32)) {
        nonPrintableCount++;
      }
    }

    // If >30% non-printable characters, consider it binary
    return nonPrintableCount / bytesRead > 0.3;
  } catch (error) {
    // On error, assume text (safer than assuming binary)
    return false;
  } finally {
    if (fh) {
      try {
        await fh.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
}
```

**Step 3: Implement file type detection with extension list**

```typescript
import mime from 'mime';
import * as path from 'node:path';

// Known binary extensions
export const BINARY_EXTENSIONS: string[] = [
  '.bin',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.class',
  '.jar',
  '.war',
  '.zip',
  '.tar',
  '.gz',
  '.bz2',
  '.rar',
  '.7z',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wav',
  '.pdf',
  '.pyc',
  '.pyo',
  '.dat',
  '.obj',
  '.o',
  '.a',
  '.lib',
  '.wasm',
].sort();

export async function detectFileType(
  filePath: string
): Promise<'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'svg'> {
  const ext = path.extname(filePath).toLowerCase();

  // TypeScript extensions override MIME type
  if (['.ts', '.mts', '.cts'].includes(ext)) {
    return 'text';
  }

  // SVG is special case (XML-based image)
  if (ext === '.svg') {
    return 'svg';
  }

  // Check MIME type first
  const lookedUpMimeType = mime.getType(filePath);
  if (lookedUpMimeType) {
    if (lookedUpMimeType.startsWith('image/')) {
      return 'image';
    }
    if (lookedUpMimeType.startsWith('audio/')) {
      return 'audio';
    }
    if (lookedUpMimeType.startsWith('video/')) {
      return 'video';
    }
    if (lookedUpMimeType === 'application/pdf') {
      return 'pdf';
    }
  }

  // Check against known binary extensions
  if (BINARY_EXTENSIONS.includes(ext)) {
    return 'binary';
  }

  // Fall back to content-based check
  if (await isBinaryFile(filePath)) {
    return 'binary';
  }

  return 'text';
}
```

### Complete Example

```typescript
// packages/core/src/utils/fileUtils.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import mime from 'mime';

type UnicodeEncoding = 'utf8' | 'utf16le' | 'utf16be' | 'utf32le' | 'utf32be';

interface BOMInfo {
  encoding: UnicodeEncoding;
  bomLength: number;
}

export function detectBOM(buf: Buffer): BOMInfo | null {
  if (buf.length >= 4) {
    if (buf[0] === 0xff && buf[1] === 0xfe && buf[2] === 0x00 && buf[3] === 0x00) {
      return { encoding: 'utf32le', bomLength: 4 };
    }
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0xfe && buf[3] === 0xff) {
      return { encoding: 'utf32be', bomLength: 4 };
    }
  }
  if (buf.length >= 3) {
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      return { encoding: 'utf8', bomLength: 3 };
    }
  }
  if (buf.length >= 2) {
    if (
      buf[0] === 0xff &&
      buf[1] === 0xfe &&
      (buf.length < 4 || buf[2] !== 0x00 || buf[3] !== 0x00)
    ) {
      return { encoding: 'utf16le', bomLength: 2 };
    }
    if (buf[0] === 0xfe && buf[1] === 0xff) {
      return { encoding: 'utf16be', bomLength: 2 };
    }
  }
  return null;
}

export async function isBinaryFile(filePath: string): Promise<boolean> {
  let fh: fs.FileHandle | null = null;
  try {
    fh = await fs.open(filePath, 'r');
    const stats = await fh.stat();
    const fileSize = stats.size;
    if (fileSize === 0) return false;

    const sampleSize = Math.min(4096, fileSize);
    const buf = Buffer.alloc(sampleSize);
    const { bytesRead } = await fh.read(buf, 0, sampleSize, 0);
    if (bytesRead === 0) return false;

    const bom = detectBOM(buf.subarray(0, Math.min(4, bytesRead)));
    if (bom) return false;

    let nonPrintableCount = 0;
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true;
      if (buf[i] < 9 || (buf[i] > 13 && buf[i] < 32)) {
        nonPrintableCount++;
      }
    }
    return nonPrintableCount / bytesRead > 0.3;
  } catch (error) {
    return false;
  } finally {
    if (fh) {
      try {
        await fh.close();
      } catch (closeError) {
        // Ignore
      }
    }
  }
}

export const BINARY_EXTENSIONS: string[] = [
  '.bin',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.class',
  '.jar',
  '.war',
  '.zip',
  '.tar',
  '.gz',
  '.bz2',
  '.rar',
  '.7z',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wav',
  '.pdf',
].sort();

export async function detectFileType(
  filePath: string
): Promise<'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'svg'> {
  const ext = path.extname(filePath).toLowerCase();

  if (['.ts', '.mts', '.cts'].includes(ext)) {
    return 'text';
  }

  if (ext === '.svg') {
    return 'svg';
  }

  const lookedUpMimeType = mime.getType(filePath);
  if (lookedUpMimeType) {
    if (lookedUpMimeType.startsWith('image/')) return 'image';
    if (lookedUpMimeType.startsWith('audio/')) return 'audio';
    if (lookedUpMimeType.startsWith('video/')) return 'video';
    if (lookedUpMimeType === 'application/pdf') return 'pdf';
  }

  if (BINARY_EXTENSIONS.includes(ext)) {
    return 'binary';
  }

  if (await isBinaryFile(filePath)) {
    return 'binary';
  }

  return 'text';
}

// Usage
const fileType = await detectFileType('/path/to/file.png');
console.log(fileType); // 'image'

const isBinary = await isBinaryFile('/path/to/executable');
console.log(isBinary); // true

const bom = detectBOM(Buffer.from([0xef, 0xbb, 0xbf, 0x48, 0x65]));
console.log(bom); // { encoding: 'utf8', bomLength: 3 }
```

**Example explained:**

- Lines 1-58: BOM detection for all Unicode encodings
- Lines 60-96: Content-based binary detection with 4KB sampling
- Lines 98-130: File type detection with multi-level fallback

### When to Use

**Use binary file detection when:**

- Processing files from user's file system
- Need to avoid corrupting binary content
- Filtering files for text processing tools
- Building file analysis or search tools

**Avoid this pattern when:**

- Only processing known text files
- Extension-based filtering is sufficient
- Performance is critical and all files are text

### Benefits

- **Accuracy**: Multi-level detection catches edge cases
- **Performance**: 4KB sampling limits I/O cost
- **Unicode Support**: BOM detection prevents false positives
- **Cross-Platform**: Works on Windows, macOS, Linux

### Trade-offs

- **I/O Cost**: Reading file content adds overhead
- **False Positives**: 30% threshold may misclassify some files
- **Sampling Limitation**: Binary data after 4KB not detected

### Common Mistakes

**Mistake 1: Not checking BOM before content analysis**

Bad example:

```typescript
async function isBinaryFile(filePath: string): Promise<boolean> {
  const buf = await fs.readFile(filePath);
  // UTF-16 files have null bytes, falsely detected as binary
  return buf.includes(0);
}
```

Correct approach:

```typescript
async function isBinaryFile(filePath: string): Promise<boolean> {
  const buf = await fs.readFile(filePath);

  // Check BOM first
  const bom = detectBOM(buf);
  if (bom) return false; // Has BOM = text file

  // Then check for null bytes
  return buf.includes(0);
}
```

**Why this matters**: UTF-16 and UTF-32 text files contain null bytes. Without BOM detection, they are misclassified as binary.

**Mistake 2: Reading entire file for detection**

Bad example:

```typescript
async function isBinaryFile(filePath: string): Promise<boolean> {
  // Reads entire file - slow for large files
  const buf = await fs.readFile(filePath);
  return checkBinary(buf);
}
```

Correct approach:

```typescript
async function isBinaryFile(filePath: string): Promise<boolean> {
  // Read only first 4KB
  const fh = await fs.open(filePath, 'r');
  const sampleSize = Math.min(4096, await fh.stat().size);
  const buf = Buffer.alloc(sampleSize);
  await fh.read(buf, 0, sampleSize, 0);
  await fh.close();
  return checkBinary(buf);
}
```

**Why this matters**: Binary detection only needs a sample. Reading entire multi-GB files wastes time and memory.

### Testing Strategy

**What to Test:**

- BOM detection for all Unicode encodings
- Binary file detection (null bytes, non-printable ratio)
- Text file detection (no null bytes, low non-printable)
- Edge cases (empty files, very small files)
- Known binary extensions
- Content-based fallback

**Test Organization:**

- Separate tests for BOM detection, binary detection, file type detection
- Use test fixtures for binary and text samples
- Test each Unicode encoding

**Mock Strategy:**

- Create test files with known content
- Use Buffer for BOM detection tests
- Use temporary files for integration tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { detectBOM, isBinaryFile, detectFileType } from './fileUtils.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Binary File Detection', () => {
  describe('detectBOM', () => {
    // UTF-8 BOM
    it('should detect UTF-8 BOM', () => {
      // Arrange
      const buf = Buffer.from([0xef, 0xbb, 0xbf, 0x48, 0x65]);

      // Act
      const bom = detectBOM(buf);

      // Assert
      expect(bom).to.deep.equal({ encoding: 'utf8', bomLength: 3 });
    });

    // UTF-16 LE BOM
    it('should detect UTF-16 LE BOM', () => {
      // Arrange
      const buf = Buffer.from([0xff, 0xfe, 0x48, 0x00]);

      // Act
      const bom = detectBOM(buf);

      // Assert
      expect(bom).to.deep.equal({ encoding: 'utf16le', bomLength: 2 });
    });

    // No BOM
    it('should return null for no BOM', () => {
      // Arrange
      const buf = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

      // Act
      const bom = detectBOM(buf);

      // Assert
      expect(bom).to.be.null;
    });
  });

  describe('isBinaryFile', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'binary-test-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    // Text file
    it('should identify text file correctly', async () => {
      // Arrange
      const textFile = path.join(tempDir, 'text.txt');
      await fs.writeFile(textFile, 'Hello, world!\nThis is text.', 'utf-8');

      // Act
      const result = await isBinaryFile(textFile);

      // Assert
      expect(result).to.be.false;
    });

    // Binary file with null bytes
    it('should identify binary file with null bytes', async () => {
      // Arrange
      const binaryFile = path.join(tempDir, 'binary.bin');
      const buf = Buffer.alloc(100);
      buf[50] = 0; // Null byte
      await fs.writeFile(binaryFile, buf);

      // Act
      const result = await isBinaryFile(binaryFile);

      // Assert
      expect(result).to.be.true;
    });

    // UTF-8 BOM file (should be text)
    it('should not mistake UTF-8 BOM file as binary', async () => {
      // Arrange
      const utf8File = path.join(tempDir, 'utf8.txt');
      const buf = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]), // BOM
        Buffer.from('Hello', 'utf-8'),
      ]);
      await fs.writeFile(utf8File, buf);

      // Act
      const result = await isBinaryFile(utf8File);

      // Assert
      expect(result).to.be.false; // BOM indicates text
    });

    // Empty file
    it('should treat empty file as text', async () => {
      // Arrange
      const emptyFile = path.join(tempDir, 'empty.txt');
      await fs.writeFile(emptyFile, '');

      // Act
      const result = await isBinaryFile(emptyFile);

      // Assert
      expect(result).to.be.false;
    });
  });

  describe('detectFileType', () => {
    // Image file by extension
    it('should detect image file by extension', async () => {
      // Act
      const type = await detectFileType('/path/to/file.png');

      // Assert
      expect(type).to.equal('image');
    });

    // TypeScript override
    it('should detect TypeScript files as text', async () => {
      // Act
      const type = await detectFileType('/path/to/file.ts');

      // Assert
      expect(type).to.equal('text');
    });

    // SVG special case
    it('should detect SVG files separately', async () => {
      // Act
      const type = await detectFileType('/path/to/file.svg');

      // Assert
      expect(type).to.equal('svg');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 95%+
- Branch coverage: 90%+
- Test all BOM types
- Test binary and text edge cases
- Test file type detection paths

### Related Patterns

- **[Pattern-Based File Exclusions](#pattern-6-pattern-based-file-exclusions)** - Uses BINARY_EXTENSIONS list
- **[High-Performance Directory Traversal](#pattern-5-high-performance-directory-traversal)** - May use binary detection to skip files

---

## Pattern 5: High-Performance Directory Traversal

### Intent

Efficiently traverse large directory trees with caching, fuzzy search, and optimized filtering to handle codebases with 100k+ files.

### Solution

Use specialized file crawling library (fdir) for fast traversal. Implement two-level caching (crawl results + search results). Apply directory-level filtering during traversal to prune subtrees early. Use fuzzy search (fzf) for interactive scenarios with adaptive algorithm selection based on file count.

### Structure

```typescript
interface CrawlOptions {
  crawlDirectory: string;
  cwd: string;
  maxDepth?: number;
  ignore: Ignore;
  cache: boolean;
  cacheTtl: number;
}

async function crawl(options: CrawlOptions): Promise<string[]>;

class ResultCache {
  async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }>;
  set(query: string, results: string[]): void;
}

class FileSearch {
  async initialize(): Promise<void>;
  async search(pattern: string, options: SearchOptions): Promise<string[]>;
}
```

### Implementation

**Step 1: Implement high-performance crawler with fdir**

```typescript
// packages/core/src/utils/filesearch/crawler.ts
import { fdir } from 'fdir';
import * as path from 'node:path';
import { Ignore } from './ignore.js';
import * as cache from './crawlCache.js';

export interface CrawlOptions {
  crawlDirectory: string;
  cwd: string;
  maxDepth?: number;
  ignore: Ignore;
  cache: boolean;
  cacheTtl: number;
}

function toPosixPath(p: string): string {
  return p.replace(/\\/g, '/');
}

export async function crawl(options: CrawlOptions): Promise<string[]> {
  // Check cache first
  if (options.cache) {
    const cacheKey = cache.getCacheKey(
      options.crawlDirectory,
      options.ignore.getFingerprint(),
      options.maxDepth
    );
    const cachedResults = cache.read(cacheKey);

    if (cachedResults) {
      return cachedResults;
    }
  }

  const posixCwd = toPosixPath(options.cwd);
  const posixCrawlDirectory = toPosixPath(options.crawlDirectory);

  let results: string[];
  try {
    const dirFilter = options.ignore.getDirectoryFilter();

    // Build fdir API with optimizations
    const api = new fdir()
      .withRelativePaths()
      .withDirs() // Include directories in results
      .withPathSeparator('/') // Always use POSIX paths
      .exclude((_, dirPath) => {
        // Apply ignore rules at directory level
        const relativePath = path.posix.relative(posixCrawlDirectory, dirPath);
        return dirFilter(`${relativePath}/`);
      });

    if (options.maxDepth !== undefined) {
      api.withMaxDepth(options.maxDepth);
    }

    results = await api.crawl(options.crawlDirectory).withPromise();
  } catch (_e) {
    return []; // Return empty on error
  }

  // Convert paths relative to cwd
  const relativeToCrawlDir = path.posix.relative(posixCwd, posixCrawlDirectory);
  const relativeToCwdResults = results.map((p) => path.posix.join(relativeToCrawlDir, p));

  // Write to cache
  if (options.cache) {
    const cacheKey = cache.getCacheKey(
      options.crawlDirectory,
      options.ignore.getFingerprint(),
      options.maxDepth
    );
    cache.write(cacheKey, relativeToCwdResults, options.cacheTtl * 1000);
  }

  return relativeToCwdResults;
}
```

**Step 2: Implement result cache with prefix optimization**

```typescript
// packages/core/src/utils/filesearch/result-cache.ts

export class ResultCache {
  private readonly cache: Map<string, string[]>;
  private hits = 0;
  private misses = 0;

  constructor(private readonly allFiles: string[]) {
    this.cache = new Map();
  }

  async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }> {
    const isCacheHit = this.cache.has(query);

    if (isCacheHit) {
      this.hits++;
      return { files: this.cache.get(query)!, isExactMatch: true };
    }

    this.misses++;

    // Core optimization: prefix-based cache lookup
    // If user searches "foo" then "foobar", use "foo" results as base
    let bestBaseQuery = '';
    for (const key of this.cache.keys()) {
      if (query.startsWith(key) && key.length > bestBaseQuery.length) {
        bestBaseQuery = key;
      }
    }

    const filesToSearch = bestBaseQuery ? this.cache.get(bestBaseQuery)! : this.allFiles;

    return { files: filesToSearch, isExactMatch: false };
  }

  set(query: string, results: string[]): void {
    this.cache.set(query, results);
  }

  getStats(): { hits: number; misses: number } {
    return { hits: this.hits, misses: this.misses };
  }
}
```

**Step 3: Implement file search with fuzzy matching**

```typescript
// packages/core/src/utils/filesearch/fileSearch.ts
import { AsyncFzf, type FzfResultItem } from 'fzf';
import picomatch from 'picomatch';
import { crawl } from './crawler.js';
import { loadIgnoreRules, type Ignore } from './ignore.js';
import { ResultCache } from './result-cache.js';

export interface FileSearchOptions {
  projectRoot: string;
  useGitignore: boolean;
  useCustomignore: boolean;
  ignoreDirs: string[];
  cache: boolean;
  cacheTtl: number;
  maxDepth?: number;
  disableFuzzySearch: boolean;
}

export interface SearchOptions {
  signal?: AbortSignal;
  maxResults?: number;
}

export interface FileSearch {
  initialize(): Promise<void>;
  search(pattern: string, options?: SearchOptions): Promise<string[]>;
}

class RecursiveFileSearch implements FileSearch {
  private ignore: Ignore | undefined;
  private resultCache: ResultCache | undefined;
  private allFiles: string[] = [];
  private fzf: AsyncFzf<string[]> | undefined;

  constructor(private readonly options: FileSearchOptions) {}

  async initialize(): Promise<void> {
    // Load ignore rules
    this.ignore = loadIgnoreRules({
      projectRoot: this.options.projectRoot,
      useGitignore: this.options.useGitignore,
      useCustomignore: this.options.useCustomignore,
      ignoreDirs: this.options.ignoreDirs,
    });

    // Crawl file system
    this.allFiles = await crawl({
      crawlDirectory: this.options.projectRoot,
      cwd: this.options.projectRoot,
      ignore: this.ignore,
      cache: this.options.cache,
      cacheTtl: this.options.cacheTtl,
      maxDepth: this.options.maxDepth,
    });

    // Build result cache and fuzzy searcher
    this.buildResultCache();
  }

  private buildResultCache(): void {
    this.resultCache = new ResultCache(this.allFiles);

    if (!this.options.disableFuzzySearch) {
      // Adaptive algorithm: v1 for >20k files (faster), v2 for smaller (better quality)
      this.fzf = new AsyncFzf(this.allFiles, {
        fuzzy: this.allFiles.length > 20000 ? 'v1' : 'v2',
      });
    }
  }

  async search(pattern: string, options: SearchOptions = {}): Promise<string[]> {
    pattern = pattern || '*';

    // Get candidates from cache (may return subset for prefix queries)
    const { files: candidates, isExactMatch } = await this.resultCache!.get(pattern);

    let filteredCandidates: string[];

    if (isExactMatch) {
      filteredCandidates = candidates;
    } else {
      let shouldCache = true;

      if (pattern.includes('*') || !this.fzf) {
        // Use picomatch for glob patterns
        filteredCandidates = await this.filter(candidates, pattern, options.signal);
      } else {
        // Use fzf for fuzzy search
        try {
          const results = await this.fzf.find(pattern);
          filteredCandidates = results.map((entry: FzfResultItem<string>) => entry.item);
        } catch {
          shouldCache = false;
          filteredCandidates = [];
        }
      }

      if (shouldCache) {
        this.resultCache!.set(pattern, filteredCandidates);
      }
    }

    // Final filtering with ignore rules
    const fileFilter = this.ignore!.getFileFilter();
    const results: string[] = [];

    for (const [i, candidate] of filteredCandidates.entries()) {
      // Yield control every 1000 items for responsiveness
      if (i % 1000 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
        if (options.signal?.aborted) {
          throw new Error('Search aborted');
        }
      }

      if (results.length >= (options.maxResults ?? Infinity)) {
        break;
      }

      if (candidate === '.') {
        continue;
      }

      if (!fileFilter(candidate)) {
        results.push(candidate);
      }
    }

    return results;
  }

  private async filter(
    allPaths: string[],
    pattern: string,
    signal: AbortSignal | undefined
  ): Promise<string[]> {
    const patternFilter = picomatch(pattern, {
      dot: true,
      contains: true,
      nocase: true,
    });

    const results: string[] = [];
    for (const [i, p] of allPaths.entries()) {
      if (i % 1000 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
        if (signal?.aborted) {
          throw new Error('Search aborted');
        }
      }

      if (patternFilter(p)) {
        results.push(p);
      }
    }

    // Optimized sorting: directories first, then alphabetical
    results.sort((a, b) => {
      const aIsDir = a.endsWith('/');
      const bIsDir = b.endsWith('/');

      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;

      // Direct comparison is 40% faster than localeCompare
      return a < b ? -1 : a > b ? 1 : 0;
    });

    return results;
  }
}

export function createFileSearch(options: FileSearchOptions): FileSearch {
  return new RecursiveFileSearch(options);
}
```

### Complete Example

```typescript
// Usage example
import { createFileSearch } from './utils/filesearch/fileSearch.js';

const fileSearch = createFileSearch({
  projectRoot: '/project/root',
  useGitignore: true,
  useCustomignore: true,
  ignoreDirs: ['.git', 'node_modules'],
  cache: true,
  cacheTtl: 300, // 5 minutes
  maxDepth: undefined,
  disableFuzzySearch: false,
});

// Initialize (crawl file system once)
await fileSearch.initialize();

// Fast searches with caching
const results1 = await fileSearch.search('*.ts');
console.log(`Found ${results1.length} TypeScript files`);

// Fuzzy search
const results2 = await fileSearch.search('fileUtils');
console.log(results2);
// ['src/utils/fileUtils.ts', 'test/utils/fileUtils.test.ts']

// Prefix optimization
const results3 = await fileSearch.search('src/'); // Cached
const results4 = await fileSearch.search('src/utils/'); // Uses results3 as base

// With abort signal
const controller = new AbortController();
setTimeout(() => controller.abort(), 1000);

try {
  const results5 = await fileSearch.search('*', {
    signal: controller.signal,
    maxResults: 100,
  });
} catch (error) {
  console.log('Search aborted');
}
```

**Example explained:**

- Initialization crawls once, caches results
- Searches use cached results when possible
- Fuzzy search with adaptive algorithm (v1/v2)
- Prefix optimization reduces search space
- Abort signal for long-running searches
- Event loop yielding for responsiveness

### When to Use

**Use high-performance traversal when:**

- Processing large codebases (10k+ files)
- Interactive file search with user typing
- Need fuzzy matching for user-friendly search
- Repeated searches over same file set
- Performance is critical for user experience

**Avoid this pattern when:**

- Small codebases (< 1000 files)
- One-time traversal with no repeat searches
- Simple glob matching is sufficient
- Memory constraints prevent caching

### Benefits

- **Fast Crawling**: fdir is highly optimized for directory traversal
- **Smart Caching**: Two-level caching reduces redundant work
- **Fuzzy Search**: User-friendly search with fzf
- **Adaptive**: Algorithm selection based on file count
- **Responsive**: Event loop yielding prevents UI freezing
- **Early Pruning**: Directory-level filtering skips entire subtrees

### Trade-offs

- **Memory Usage**: Caching all file paths uses memory
- **Initialization Cost**: Initial crawl takes time
- **Complexity**: Multiple layers of caching and optimization
- **Dependencies**: Requires fdir, fzf, picomatch packages

### Common Mistakes

**Mistake 1: Not yielding to event loop during large operations**

Bad example:

```typescript
for (const file of files) {
  // Process synchronously - blocks event loop for large arrays
  processFile(file);
}
```

Correct approach:

```typescript
for (const [i, file] of files.entries()) {
  if (i % 1000 === 0) {
    // Yield every 1000 items
    await new Promise((resolve) => setImmediate(resolve));
  }
  processFile(file);
}
```

**Why this matters**: Long-running synchronous operations block the event loop, freezing the UI or preventing other async operations.

**Mistake 2: Not using directory-level filtering**

Bad example:

```typescript
// Crawl all files, then filter
const allFiles = await crawl(rootDir);
const filtered = allFiles.filter((f) => !shouldIgnore(f));
```

Correct approach:

```typescript
// Filter directories during crawl
const api = new fdir().exclude((_, dirPath) => {
  return shouldIgnoreDir(dirPath); // Skip entire subtree
});
const results = await api.crawl(rootDir).withPromise();
```

**Why this matters**: Filtering after crawl wastes time crawling ignored directories. Directory-level filtering prunes entire subtrees early.

### Testing Strategy

**What to Test:**

- Crawl returns all non-ignored files
- Cache hit/miss behavior
- Prefix optimization works
- Fuzzy search finds relevant files
- Glob patterns match correctly
- Abort signal stops search
- Event loop yielding occurs

**Test Organization:**

- Integration tests with temporary directories
- Unit tests for cache and filter logic
- Performance tests for large file counts

**Mock Strategy:**

- Create temporary directory structures
- Use real file system for integration tests
- Mock fdir for unit tests of filter logic

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createFileSearch } from './fileSearch.js';

describe('High-Performance File Search', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'search-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTestStructure(): Promise<void> {
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.mkdir(path.join(tempDir, 'test'));
    await fs.mkdir(path.join(tempDir, 'node_modules'));

    await fs.writeFile(path.join(tempDir, 'src/index.ts'), '');
    await fs.writeFile(path.join(tempDir, 'src/utils.ts'), '');
    await fs.writeFile(path.join(tempDir, 'test/index.test.ts'), '');
    await fs.writeFile(path.join(tempDir, 'node_modules/package/index.js'), '');
  }

  // Basic search
  it('should find files matching glob pattern', async () => {
    // Arrange
    await createTestStructure();
    await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules/');

    const search = createFileSearch({
      projectRoot: tempDir,
      useGitignore: true,
      useCustomignore: false,
      ignoreDirs: [],
      cache: false,
      cacheTtl: 0,
      disableFuzzySearch: true,
    });

    await search.initialize();

    // Act
    const results = await search.search('*.ts');

    // Assert
    expect(results).to.have.lengthOf(3);
    expect(results).to.include('src/index.ts');
    expect(results).to.include('src/utils.ts');
    expect(results).to.include('test/index.test.ts');
  });

  // Fuzzy search
  it('should find files with fuzzy matching', async () => {
    // Arrange
    await createTestStructure();

    const search = createFileSearch({
      projectRoot: tempDir,
      useGitignore: false,
      useCustomignore: false,
      ignoreDirs: ['node_modules'],
      cache: false,
      cacheTtl: 0,
      disableFuzzySearch: false,
    });

    await search.initialize();

    // Act
    const results = await search.search('utils');

    // Assert
    expect(results).to.include('src/utils.ts');
  });

  // Caching
  it('should cache search results', async () => {
    // Arrange
    await createTestStructure();

    const search = createFileSearch({
      projectRoot: tempDir,
      useGitignore: false,
      useCustomignore: false,
      ignoreDirs: [],
      cache: true,
      cacheTtl: 300,
      disableFuzzySearch: true,
    });

    await search.initialize();

    // Act - first search (miss)
    const start1 = Date.now();
    await search.search('*.ts');
    const time1 = Date.now() - start1;

    // Act - second search (hit)
    const start2 = Date.now();
    await search.search('*.ts');
    const time2 = Date.now() - start2;

    // Assert - cached search should be much faster
    expect(time2).to.be.lessThan(time1 / 2);
  });

  // Abort signal
  it('should respect abort signal', async () => {
    // Arrange
    await createTestStructure();
    const search = createFileSearch({
      projectRoot: tempDir,
      useGitignore: false,
      useCustomignore: false,
      ignoreDirs: [],
      cache: false,
      cacheTtl: 0,
      disableFuzzySearch: true,
    });

    await search.initialize();

    const controller = new AbortController();
    controller.abort(); // Abort immediately

    // Act & Assert
    try {
      await search.search('*', { signal: controller.signal });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.message).to.include('abort');
    }
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Branch coverage: 80%+
- Test caching behavior
- Test fuzzy vs glob search
- Test performance optimizations

### Related Patterns

- **[Gitignore-Style Filtering](#pattern-1-gitignore-style-filtering)** - Used for ignore rules
- **[Caching Pattern](./14-performance.md#caching)** - Two-level caching implementation

---

## Pattern 6: Pattern-Based File Exclusions

### Intent

Provide predefined pattern sets for common file exclusions, reducing boilerplate and ensuring consistent filtering across the application.

### Problem

Every file discovery operation needs to exclude common patterns (node_modules, .git, binary files, etc.). Manually specifying these patterns in every location is error-prone, inconsistent, and verbose. Different operations need different exclusion levels (core patterns vs comprehensive patterns).

### Solution

Define reusable pattern collections as constants. Create an exclusion service that combines default patterns with custom patterns based on use case. Provide different pattern sets for different scenarios (glob operations vs read-many-files operations).

### Structure

```typescript
// Predefined pattern collections
export const COMMON_IGNORE_PATTERNS: string[];
export const BINARY_FILE_PATTERNS: string[];
export const COMMON_DIRECTORY_EXCLUDES: string[];
export const DEFAULT_FILE_EXCLUDES: string[];

// Exclusion service
export class FileExclusions {
  getCoreIgnorePatterns(): string[];
  getDefaultExcludePatterns(options?: ExcludeOptions): string[];
  getGlobExcludes(additionalExcludes?: string[]): string[];
}
```

### Implementation

**Step 1: Define predefined pattern collections**

```typescript
// packages/core/src/utils/ignorePatterns.ts

// Basic version control and dependency exclusions
export const COMMON_IGNORE_PATTERNS: string[] = [
  '**/node_modules/**',
  '**/.git/**',
  '**/bower_components/**',
  '**/.svn/**',
  '**/.hg/**',
];

// Binary file patterns
export const BINARY_FILE_PATTERNS: string[] = [
  '**/*.bin',
  '**/*.exe',
  '**/*.dll',
  '**/*.so',
  '**/*.dylib',
  '**/*.class',
  '**/*.jar',
  '**/*.war',
  '**/*.zip',
  '**/*.tar',
  '**/*.gz',
  '**/*.bz2',
  '**/*.rar',
  '**/*.7z',
  '**/*.doc',
  '**/*.docx',
  '**/*.xls',
  '**/*.xlsx',
  '**/*.ppt',
  '**/*.pptx',
  '**/*.odt',
  '**/*.ods',
  '**/*.odp',
];

// Media files (can be processed as inlineData)
export const MEDIA_FILE_PATTERNS: string[] = [
  '**/*.pdf',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.webp',
  '**/*.bmp',
  '**/*.svg',
];

// Common IDE and build directories
export const COMMON_DIRECTORY_EXCLUDES: string[] = [
  '**/.vscode/**',
  '**/.idea/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/__pycache__/**',
];

// Python-specific
export const PYTHON_EXCLUDES: string[] = ['**/*.pyc', '**/*.pyo'];

// System files
export const SYSTEM_FILE_EXCLUDES: string[] = ['**/.DS_Store', '**/.env'];

// Comprehensive default excludes (combination of all above)
export const DEFAULT_FILE_EXCLUDES: string[] = [
  ...COMMON_IGNORE_PATTERNS,
  ...COMMON_DIRECTORY_EXCLUDES,
  ...BINARY_FILE_PATTERNS,
  ...PYTHON_EXCLUDES,
  ...SYSTEM_FILE_EXCLUDES,
];
```

**Step 2: Create exclusion service with flexible options**

```typescript
// packages/core/src/utils/ignorePatterns.ts

export interface ExcludeOptions {
  includeDefaults?: boolean;
  customPatterns?: string[];
  runtimePatterns?: string[];
  includeDynamicPatterns?: boolean;
}

export class FileExclusions {
  constructor(private config?: Config) {}

  // Core patterns for basic operations like glob
  getCoreIgnorePatterns(): string[] {
    return [...COMMON_IGNORE_PATTERNS];
  }

  // Comprehensive patterns for read-many-files
  getDefaultExcludePatterns(options: ExcludeOptions = {}): string[] {
    const {
      includeDefaults = true,
      customPatterns = [],
      runtimePatterns = [],
      includeDynamicPatterns = true,
    } = options;

    const patterns: string[] = [];

    // Add default comprehensive patterns
    if (includeDefaults) {
      patterns.push(...DEFAULT_FILE_EXCLUDES);
    }

    // Add dynamic patterns (e.g., current output file)
    if (includeDynamicPatterns) {
      patterns.push(`**/${getCurrentOutputFilename()}`);
    }

    // Add custom patterns from configuration
    if (this.config) {
      const configCustomExcludes = this.config.getCustomExcludes?.() ?? [];
      patterns.push(...configCustomExcludes);
    }

    // Add custom and runtime patterns
    patterns.push(...customPatterns);
    patterns.push(...runtimePatterns);

    return patterns;
  }

  // Glob-specific excludes (minimal)
  getGlobExcludes(additionalExcludes: string[] = []): string[] {
    const corePatterns = this.getCoreIgnorePatterns();
    const configPatterns = this.config?.getCustomExcludes?.() ?? [];
    return [...corePatterns, ...configPatterns, ...additionalExcludes];
  }
}
```

**Step 3: Add extension extraction utility**

```typescript
// packages/core/src/utils/ignorePatterns.ts

export function extractExtensionsFromPatterns(patterns: string[]): string[] {
  const extensions = new Set(
    patterns
      .filter((pattern) => pattern.includes('*.'))
      .flatMap((pattern) => {
        const extPart = pattern.substring(pattern.lastIndexOf('*.') + 1);

        // Handle brace expansion e.g. `**/*.{jpg,png}`
        if (extPart.startsWith('.{') && extPart.endsWith('}')) {
          const inner = extPart.slice(2, -1); // get 'jpg,png'
          return inner
            .split(',')
            .map((ext) => `.${ext.trim()}`)
            .filter((ext) => ext !== '.');
        }

        // Handle simple extensions
        if (
          extPart.startsWith('.') &&
          !extPart.includes('/') &&
          !extPart.includes('{') &&
          !extPart.includes('}')
        ) {
          const extracted = path.extname(`dummy${extPart}`);
          const result = extracted || extPart;
          return result && result !== '.' && !result.substring(1).includes('.') ? [result] : [];
        }
        return [];
      })
  );
  return Array.from(extensions).sort();
}

// Binary extensions list (extracted from patterns)
export const BINARY_EXTENSIONS: string[] = [
  ...extractExtensionsFromPatterns([
    ...BINARY_FILE_PATTERNS,
    ...MEDIA_FILE_PATTERNS,
    ...PYTHON_EXCLUDES,
  ]),
  '.dat',
  '.obj',
  '.o',
  '.a',
  '.lib',
  '.wasm',
].sort();
```

### Complete Example

```typescript
// packages/core/src/utils/ignorePatterns.ts
import * as path from 'node:path';
import type { Config } from '../config/config.js';

export const COMMON_IGNORE_PATTERNS: string[] = [
  '**/node_modules/**',
  '**/.git/**',
  '**/bower_components/**',
  '**/.svn/**',
  '**/.hg/**',
];

export const BINARY_FILE_PATTERNS: string[] = [
  '**/*.bin',
  '**/*.exe',
  '**/*.dll',
  '**/*.so',
  '**/*.dylib',
  '**/*.class',
  '**/*.jar',
  '**/*.war',
  '**/*.zip',
  '**/*.tar',
  '**/*.gz',
  '**/*.bz2',
  '**/*.rar',
  '**/*.7z',
];

export const COMMON_DIRECTORY_EXCLUDES: string[] = [
  '**/.vscode/**',
  '**/.idea/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
];

export const DEFAULT_FILE_EXCLUDES: string[] = [
  ...COMMON_IGNORE_PATTERNS,
  ...COMMON_DIRECTORY_EXCLUDES,
  ...BINARY_FILE_PATTERNS,
];

export interface ExcludeOptions {
  includeDefaults?: boolean;
  customPatterns?: string[];
  runtimePatterns?: string[];
}

export class FileExclusions {
  constructor(private config?: Config) {}

  getCoreIgnorePatterns(): string[] {
    return [...COMMON_IGNORE_PATTERNS];
  }

  getDefaultExcludePatterns(options: ExcludeOptions = {}): string[] {
    const { includeDefaults = true, customPatterns = [], runtimePatterns = [] } = options;

    const patterns: string[] = [];

    if (includeDefaults) {
      patterns.push(...DEFAULT_FILE_EXCLUDES);
    }

    if (this.config) {
      const configCustomExcludes = this.config.getCustomExcludes?.() ?? [];
      patterns.push(...configCustomExcludes);
    }

    patterns.push(...customPatterns);
    patterns.push(...runtimePatterns);

    return patterns;
  }

  getGlobExcludes(additionalExcludes: string[] = []): string[] {
    const corePatterns = this.getCoreIgnorePatterns();
    const configPatterns = this.config?.getCustomExcludes?.() ?? [];
    return [...corePatterns, ...configPatterns, ...additionalExcludes];
  }
}

export function extractExtensionsFromPatterns(patterns: string[]): string[] {
  const extensions = new Set(
    patterns
      .filter((pattern) => pattern.includes('*.'))
      .flatMap((pattern) => {
        const extPart = pattern.substring(pattern.lastIndexOf('*.') + 1);

        if (extPart.startsWith('.{') && extPart.endsWith('}')) {
          const inner = extPart.slice(2, -1);
          return inner
            .split(',')
            .map((ext) => `.${ext.trim()}`)
            .filter((ext) => ext !== '.');
        }

        if (
          extPart.startsWith('.') &&
          !extPart.includes('/') &&
          !extPart.includes('{') &&
          !extPart.includes('}')
        ) {
          const extracted = path.extname(`dummy${extPart}`);
          const result = extracted || extPart;
          return result && result !== '.' && !result.substring(1).includes('.') ? [result] : [];
        }
        return [];
      })
  );
  return Array.from(extensions).sort();
}

export const BINARY_EXTENSIONS = extractExtensionsFromPatterns([...BINARY_FILE_PATTERNS]);

// Usage
const exclusions = new FileExclusions();

// Get core patterns for glob
const globExcludes = exclusions.getGlobExcludes(['*.tmp']);

// Get comprehensive patterns for file reading
const readExcludes = exclusions.getDefaultExcludePatterns({
  includeDefaults: true,
  customPatterns: ['*.secret'],
  runtimePatterns: ['output.txt'],
});

// Check if extension is binary
const isBinaryExt = BINARY_EXTENSIONS.includes('.exe'); // true
```

**Example explained:**

- Lines 1-30: Predefined pattern collections for different categories
- Lines 32-68: FileExclusions service with flexible pattern combination
- Lines 70-95: Extension extraction utility for pattern analysis

### When to Use

**Use pattern-based exclusions when:**

- Need consistent exclusion rules across application
- Want to avoid repeating common patterns
- Different operations need different exclusion levels
- Configuration allows custom exclusions

**Avoid this pattern when:**

- Every operation needs unique exclusions
- Predefined patterns don't match your use case
- Simplicity is more important than consistency

### Benefits

- **DRY**: Define patterns once, use everywhere
- **Consistency**: Same patterns across all operations
- **Flexibility**: Combine defaults with custom patterns
- **Maintainability**: Update patterns in one place
- **Documentation**: Pattern names document purpose

### Trade-offs

- **Less Explicit**: Patterns defined far from usage
- **Over-Exclusion**: May exclude files user wants
- **Configuration**: Requires config system for custom patterns

### Common Mistakes

**Mistake 1: Using comprehensive patterns for glob operations**

Bad example:

```typescript
// Glob with comprehensive exclusions (too slow)
const files = glob('**/*.ts', {
  ignore: DEFAULT_FILE_EXCLUDES, // 50+ patterns
});
```

Correct approach:

```typescript
// Glob with minimal core patterns
const exclusions = new FileExclusions();
const files = glob('**/*.ts', {
  ignore: exclusions.getCoreIgnorePatterns(), // 5 patterns
});
```

**Why this matters**: Glob performance degrades with many exclusion patterns. Core patterns are sufficient for glob operations.

**Mistake 2: Not allowing custom patterns**

Bad example:

```typescript
// Hardcoded patterns, no customization
function getExcludes(): string[] {
  return DEFAULT_FILE_EXCLUDES;
}
```

Correct approach:

```typescript
// Accept custom patterns via options
function getExcludes(options: ExcludeOptions = {}): string[] {
  const exclusions = new FileExclusions();
  return exclusions.getDefaultExcludePatterns(options);
}
```

**Why this matters**: Users need to exclude project-specific patterns. Hardcoded exclusions prevent customization.

### Testing Strategy

**What to Test:**

- Pattern collections contain expected patterns
- FileExclusions combines patterns correctly
- Custom patterns override defaults when needed
- Extension extraction works for all pattern formats
- BINARY_EXTENSIONS contains all binary extensions

**Test Organization:**

- Unit tests for pattern collections
- Unit tests for FileExclusions service
- Unit tests for extension extraction

**Mock Strategy:**

- No mocking needed for pattern tests
- Mock config for FileExclusions tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  COMMON_IGNORE_PATTERNS,
  DEFAULT_FILE_EXCLUDES,
  FileExclusions,
  extractExtensionsFromPatterns,
  BINARY_EXTENSIONS,
} from './ignorePatterns.js';

describe('Pattern-Based File Exclusions', () => {
  describe('Pattern Collections', () => {
    // Pattern completeness
    it('should include common ignore patterns', () => {
      expect(COMMON_IGNORE_PATTERNS).to.include('**/node_modules/**');
      expect(COMMON_IGNORE_PATTERNS).to.include('**/.git/**');
    });

    // Pattern combination
    it('should combine all patterns in DEFAULT_FILE_EXCLUDES', () => {
      expect(DEFAULT_FILE_EXCLUDES).to.include('**/node_modules/**');
      expect(DEFAULT_FILE_EXCLUDES).to.include('**/*.bin');
      expect(DEFAULT_FILE_EXCLUDES).to.include('**/.vscode/**');
    });
  });

  describe('FileExclusions', () => {
    // Core patterns
    it('should return core patterns for glob', () => {
      // Arrange
      const exclusions = new FileExclusions();

      // Act
      const patterns = exclusions.getCoreIgnorePatterns();

      // Assert
      expect(patterns).to.deep.equal(COMMON_IGNORE_PATTERNS);
    });

    // Default patterns with options
    it('should combine default and custom patterns', () => {
      // Arrange
      const exclusions = new FileExclusions();

      // Act
      const patterns = exclusions.getDefaultExcludePatterns({
        includeDefaults: true,
        customPatterns: ['*.custom'],
        runtimePatterns: ['output.txt'],
      });

      // Assert
      expect(patterns).to.include('**/node_modules/**'); // Default
      expect(patterns).to.include('*.custom'); // Custom
      expect(patterns).to.include('output.txt'); // Runtime
    });

    // Only custom patterns
    it('should return only custom patterns when defaults disabled', () => {
      // Arrange
      const exclusions = new FileExclusions();

      // Act
      const patterns = exclusions.getDefaultExcludePatterns({
        includeDefaults: false,
        customPatterns: ['*.custom'],
      });

      // Assert
      expect(patterns).to.deep.equal(['*.custom']);
    });
  });

  describe('Extension Extraction', () => {
    // Simple extension
    it('should extract simple extensions', () => {
      // Act
      const extensions = extractExtensionsFromPatterns(['**/*.js', '**/*.ts']);

      // Assert
      expect(extensions).to.deep.equal(['.js', '.ts']);
    });

    // Brace expansion
    it('should extract extensions from brace expansion', () => {
      // Act
      const extensions = extractExtensionsFromPatterns(['**/*.{jpg,png,gif}']);

      // Assert
      expect(extensions).to.deep.equal(['.gif', '.jpg', '.png']);
    });

    // Binary extensions list
    it('should include all binary extensions', () => {
      expect(BINARY_EXTENSIONS).to.include('.bin');
      expect(BINARY_EXTENSIONS).to.include('.exe');
      expect(BINARY_EXTENSIONS).to.include('.zip');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 95%+
- Branch coverage: 90%+
- Test all pattern collections
- Test all FileExclusions methods
- Test extension extraction edge cases

### Related Patterns

- **[Gitignore-Style Filtering](#pattern-1-gitignore-style-filtering)** - Uses these patterns
- **[Binary File Detection](#pattern-4-binary-file-detection)** - Uses BINARY_EXTENSIONS
- **[Service Pattern](./06-code-organization.md#service-pattern)** - FileExclusions is a service

---

## Quick Reference

### Pattern Summary Table

| Pattern                    | Use When                         | Avoid When                  | Key Benefit                |
| -------------------------- | -------------------------------- | --------------------------- | -------------------------- |
| Gitignore-Style Filtering  | Need .gitignore compatibility    | Simple filtering suffices   | Standard syntax users know |
| Multi-Level Ignore Files   | Custom rules extend .gitignore   | Single ignore file works    | Non-invasive overrides     |
| Precedence-Based Filtering | Multiple ignore sources conflict | No conflicts exist          | Predictable behavior       |
| Binary File Detection      | Processing mixed file types      | Only text files             | Prevents corruption        |
| High-Performance Traversal | Large codebases (10k+ files)     | Small codebases             | Fast search with caching   |
| Pattern-Based Exclusions   | Consistent filtering needed      | Unique exclusions each time | DRY pattern definitions    |

### Code Snippets

**Gitignore-Style Filtering - Minimal Example:**

```typescript
import { GitIgnoreParser } from './utils/gitIgnoreParser.js';

const parser = new GitIgnoreParser('/project/root');
const shouldIgnore = parser.isIgnored('node_modules/package/index.js');
```

**Multi-Level Ignore Files - Minimal Example:**

```typescript
import { FileDiscoveryService } from './services/fileDiscoveryService.js';

const service = new FileDiscoveryService('/project/root');
const filtered = service.filterFiles(allFiles);
```

**Binary File Detection - Minimal Example:**

```typescript
import { isBinaryFile } from './utils/fileUtils.js';

const isBinary = await isBinaryFile('/path/to/file');
if (!isBinary) {
  // Safe to read as text
}
```

**High-Performance Traversal - Minimal Example:**

```typescript
import { createFileSearch } from './utils/filesearch/fileSearch.js';

const search = createFileSearch({ projectRoot: '/root', cache: true });
await search.initialize();
const results = await search.search('*.ts');
```

**Pattern-Based Exclusions - Minimal Example:**

```typescript
import { FileExclusions } from './utils/ignorePatterns.js';

const exclusions = new FileExclusions();
const patterns = exclusions.getDefaultExcludePatterns();
```

---

## Related Patterns

- **[Service Pattern](./06-code-organization.md#service-pattern)** - FileDiscoveryService, FileExclusions are services
- **[Caching Pattern](./14-performance.md#caching)** - Used in high-performance traversal
- **[Integration Testing](./05-testing-patterns.md#integration-tests)** - File filtering tests use real file system

---

## References

**Source Code Examples:**

- [GitIgnoreParser](../../examplecode/gemini/packages/core/src/utils/gitIgnoreParser.ts) - Full .gitignore syntax support
- [FileDiscoveryService](../../examplecode/gemini/packages/core/src/services/fileDiscoveryService.ts) - Service coordinating multiple parsers
- [Binary Detection](../../examplecode/gemini/packages/core/src/utils/fileUtils.ts) - BOM and content-based detection
- [File Search](../../examplecode/gemini/packages/core/src/utils/filesearch/fileSearch.ts) - High-performance search with caching
- [Ignore Patterns](../../examplecode/gemini/packages/core/src/utils/ignorePatterns.ts) - Predefined pattern collections

**External Resources:**

- [ignore npm package](https://www.npmjs.com/package/ignore) - .gitignore pattern matching
- [fdir npm package](https://www.npmjs.com/package/fdir) - Fast directory crawler
- [fzf npm package](https://www.npmjs.com/package/fzf) - Fuzzy finder algorithm
- [picomatch npm package](https://www.npmjs.com/package/picomatch) - Glob pattern matching

---

## Changelog

- **2025-01-21**: Initial file filtering patterns documentation extracted from reference codebase
