# DiffRenderer Component Analysis

> Comprehensive analysis of the DiffRenderer component from gemini-cli for implementing diff visualization in FloMaster CLI.

**Source File**: `examplecode/gemini-cli/packages/cli/src/ui/components/messages/DiffRenderer.tsx`

---

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Diff Parsing Algorithm](#diff-parsing-algorithm)
4. [Syntax Highlighting](#syntax-highlighting)
5. [Line Rendering](#line-rendering)
6. [Layout and Styling](#layout-and-styling)
7. [Edge Case Handling](#edge-case-handling)
8. [Implementation Recommendations](#implementation-recommendations)

---

## Overview

The DiffRenderer component is responsible for parsing and rendering git diff output in a terminal-friendly format using Ink (React for CLI). It provides:

- **Git unified diff parsing** with line number tracking
- **Syntax highlighting** via lowlight (highlight.js compatible)
- **Semantic theming** for added/removed/context lines
- **Gap indicators** for non-contiguous hunks
- **Accessibility support** for screen readers
- **Overflow handling** via MaxSizedBox

### Component Props Interface (Lines 85-92)

```typescript
interface DiffRendererProps {
  diffContent: string;           // Raw git diff content
  filename?: string;             // For language detection
  tabWidth?: number;             // Default: 4
  availableTerminalHeight?: number;  // For overflow handling
  terminalWidth: number;         // Required for layout
  theme?: Theme;                 // Custom theme override
}
```

---

## Component Architecture

### Dependencies

| Dependency | Purpose | Location |
|------------|---------|----------|
| `lowlight` | Syntax highlighting (highlight.js) | `CodeColorizer.tsx` |
| `MaxSizedBox` | Content-aware truncation | `shared/MaxSizedBox.tsx` |
| `semantic-colors` | Theme token access | `semantic-colors.ts` |
| `useSettings` | User preferences | `SettingsContext` |
| `useAlternateBuffer` | Terminal mode detection | Hook |
| `useIsScreenReaderEnabled` | Accessibility | Ink built-in |

### Data Flow

```
diffContent (string)
       │
       ▼
parseDiffWithLineNumbers() ──► DiffLine[]
       │
       ▼
┌──────┴──────┐
│   isNewFile? │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
colorizeCode()   renderDiffContent()
(new files)      (modified files)
       │               │
       └───────┬───────┘
               ▼
         React.ReactNode
```

---

## Diff Parsing Algorithm

### Core Parser Function (Lines 25-83)

The `parseDiffWithLineNumbers` function parses unified diff format into structured data.

#### DiffLine Interface (Lines 18-23)

```typescript
interface DiffLine {
  type: 'add' | 'del' | 'context' | 'hunk' | 'other';
  oldLine?: number;    // Line number in original file
  newLine?: number;    // Line number in modified file
  content: string;     // Line content (without prefix)
}
```

#### Parsing Algorithm Pseudocode

```
FUNCTION parseDiffWithLineNumbers(diffContent: string) -> DiffLine[]:
    lines = diffContent.split('\n')
    result = []
    currentOldLine = 0
    currentNewLine = 0
    inHunk = false
    hunkHeaderRegex = /^@@ -(\d+),?\d* \+(\d+),?\d* @@/

    FOR each line in lines:
        // Check for hunk header
        IF line matches hunkHeaderRegex:
            currentOldLine = extractStartLine(match[1]) - 1
            currentNewLine = extractStartLine(match[2]) - 1
            inHunk = true
            result.push({ type: 'hunk', content: line })
            CONTINUE

        // Skip git header lines before first hunk
        IF NOT inHunk:
            IF line.startsWith('--- '):
                CONTINUE
            CONTINUE  // Skip all non-hunk content

        // Parse diff line prefixes
        IF line.startsWith('+'):
            currentNewLine++
            result.push({
                type: 'add',
                newLine: currentNewLine,
                content: line.substring(1)
            })
        ELSE IF line.startsWith('-'):
            currentOldLine++
            result.push({
                type: 'del',
                oldLine: currentOldLine,
                content: line.substring(1)
            })
        ELSE IF line.startsWith(' '):
            currentOldLine++
            currentNewLine++
            result.push({
                type: 'context',
                oldLine: currentOldLine,
                newLine: currentNewLine,
                content: line.substring(1)
            })
        ELSE IF line.startsWith('\'):
            // "\ No newline at end of file"
            result.push({ type: 'other', content: line })

    RETURN result
```

### Hunk Header Format

```
@@ -START,COUNT +START,COUNT @@ [optional context]
```

**Regex Pattern** (Line 31):
```typescript
const hunkHeaderRegex = /^@@ -(\d+),?\d* \+(\d+),?\d* @@/;
```

**Examples**:
- `@@ -1,3 +1,4 @@` - Standard hunk
- `@@ -0,0 +1,5 @@` - New file
- `@@ -1 +1 @@` - Single line change (count omitted)

### Line Number Adjustment (Lines 40-44)

```typescript
// Decrement after extracting because line number in header
// represents the FIRST line of the hunk, but we increment
// BEFORE pushing each line
currentOldLine--;
currentNewLine--;
```

---

## Syntax Highlighting

### Language Detection (Lines 415-434)

```typescript
const getLanguageFromExtension = (extension: string): string | null => {
  const languageMap: { [key: string]: string } = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    json: 'json',
    css: 'css',
    html: 'html',
    sh: 'bash',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    txt: 'plaintext',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    rb: 'ruby',
  };
  return languageMap[extension] || null;
};
```

### Language Map Table

| Extension | Language |
|-----------|----------|
| `js` | javascript |
| `ts` | typescript |
| `py` | python |
| `json` | json |
| `css` | css |
| `html` | html |
| `sh` | bash |
| `md` | markdown |
| `yaml`, `yml` | yaml |
| `txt` | plaintext |
| `java` | java |
| `c` | c |
| `cpp` | cpp |
| `rb` | ruby |
| (unknown) | null (auto-detect) |

### Highlighting Integration

**CodeColorizer.tsx** uses `lowlight` (highlight.js compatible):

```typescript
// Line 28 in CodeColorizer.tsx
const lowlight = createLowlight(common);

// Line 101-111
function highlightAndRenderLine(
  line: string,
  language: string | null,
  theme: Theme,
): React.ReactNode {
  const getHighlightedLine = () =>
    !language || !lowlight.registered(language)
      ? lowlight.highlightAuto(line)  // Auto-detect
      : lowlight.highlight(language, line);  // Explicit language

  const renderedNode = renderHastNode(getHighlightedLine(), theme, undefined);
  return renderedNode !== null ? renderedNode : line;
}
```

### HAST to React Conversion

The `renderHastNode` function (Lines 30-93 in CodeColorizer.tsx) converts highlight.js HAST (Hypertext Abstract Syntax Tree) to React nodes with proper color mapping:

```typescript
function renderHastNode(
  node: Root | Element | HastText | RootContent,
  theme: Theme,
  inheritedColor: string | undefined,
): React.ReactNode {
  if (node.type === 'text') {
    const color = inheritedColor || theme.defaultColor;
    return <Text color={color}>{node.value}</Text>;
  }

  if (node.type === 'element') {
    const nodeClasses = node.properties?.['className'] as string[];
    let elementColor: string | undefined = undefined;

    // Find color from theme based on hljs class
    for (let i = nodeClasses.length - 1; i >= 0; i--) {
      const color = theme.getInkColor(nodeClasses[i]);
      if (color) {
        elementColor = color;
        break;
      }
    }
    // ... recursive children rendering
  }
}
```

---

## Line Rendering

### Line Type Processing (Lines 310-333)

```typescript
switch (line.type) {
  case 'add':
    gutterNumStr = (line.newLine ?? '').toString();
    prefixSymbol = '+';
    lastLineNumber = line.newLine ?? null;
    break;
  case 'del':
    gutterNumStr = (line.oldLine ?? '').toString();
    prefixSymbol = '-';
    if (line.oldLine !== undefined) {
      lastLineNumber = line.oldLine;
    }
    break;
  case 'context':
    gutterNumStr = (line.newLine ?? '').toString();
    prefixSymbol = ' ';
    lastLineNumber = line.newLine ?? null;
    break;
  default:
    return acc;  // Skip unknown types
}
```

### Gutter Width Calculation (Lines 233-238)

```typescript
const maxLineNumber = Math.max(
  0,
  ...displayableLines.map((l) => l.oldLine ?? 0),
  ...displayableLines.map((l) => l.newLine ?? 0),
);
const gutterWidth = Math.max(1, maxLineNumber.toString().length);
```

### Base Indentation Normalization (Lines 245-258)

The component calculates minimum indentation across all lines to strip common leading whitespace:

```typescript
let baseIndentation = Infinity;
for (const line of displayableLines) {
  if (line.content.trim() === '') continue;

  const firstCharIndex = line.content.search(/\S/);
  const currentIndent = firstCharIndex === -1 ? 0 : firstCharIndex;
  baseIndentation = Math.min(baseIndentation, currentIndent);
}
if (!isFinite(baseIndentation)) {
  baseIndentation = 0;
}
```

### Tab Normalization (Lines 210-214)

```typescript
const normalizedLines = parsedLines.map((line) => ({
  ...line,
  content: line.content.replace(/\t/g, ' '.repeat(tabWidth)),
}));
```

---

## Layout and Styling

### Color Mapping Table

| Element | Semantic Token | Usage |
|---------|----------------|-------|
| Added line background | `background.diff.added` | Full line bg |
| Removed line background | `background.diff.removed` | Full line bg |
| Added prefix (`+`) | `status.success` | Green text |
| Removed prefix (`-`) | `status.error` | Red text |
| Line numbers | `text.secondary` | Gray text |
| Gap separator | `text.secondary` | `═` characters |
| Border | `border.default` | "No changes" box |
| Warning text | `status.warning` | "No diff content" |

### Theme Color Definitions

From `semantic-tokens.ts`:

```typescript
export interface SemanticColors {
  text: {
    primary: string;
    secondary: string;
    link: string;
    accent: string;
    response: string;
  };
  background: {
    primary: string;
    diff: {
      added: string;    // #28350B (dark) / #C6EAD8 (light)
      removed: string;  // #430000 (dark) / #FFCCCC (light)
    };
  };
  border: {
    default: string;
    focused: string;
  };
  ui: {
    comment: string;
    symbol: string;
    dark: string;
    gradient: string[] | undefined;
  };
  status: {
    error: string;     // Red for deletion prefix
    success: string;   // Green for addition prefix
    warning: string;   // Yellow for warnings
  };
}
```

### Dark Theme Colors (from theme.ts)

```typescript
export const darkTheme: ColorsTheme = {
  DiffAdded: '#28350B',      // Dark green background
  DiffRemoved: '#430000',    // Dark red background
  AccentGreen: '#A6E3A1',    // Bright green text
  AccentRed: '#F38BA8',      // Bright red text
  Gray: '#6C7086',           // Secondary text
  // ...
};
```

### Light Theme Colors

```typescript
export const lightTheme: ColorsTheme = {
  DiffAdded: '#C6EAD8',      // Light green background
  DiffRemoved: '#FFCCCC',    // Light red background
  AccentGreen: '#3CA84B',    // Green text
  AccentRed: '#DD4C4C',      // Red text
  Gray: '#97a0b0',           // Secondary text
  // ...
};
```

### Gap Indicator Rendering (Lines 278-304)

When hunks are non-contiguous (gap > 5 lines):

```typescript
const MAX_CONTEXT_LINES_WITHOUT_GAP = 5;

if (
  lastLineNumber !== null &&
  relevantLineNumberForGapCalc !== null &&
  relevantLineNumberForGapCalc > lastLineNumber + MAX_CONTEXT_LINES_WITHOUT_GAP + 1
) {
  // Render gap indicator
  if (useMaxSizedBox) {
    <Text wrap="truncate" color={semanticTheme.text.secondary}>
      {'═'.repeat(terminalWidth)}
    </Text>
  } else {
    <Box
      borderStyle="double"
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      width={terminalWidth}
      borderColor={semanticTheme.text.secondary}
    />
  }
}
```

### Line Layout Structure (Lines 343-390)

```tsx
<Box key={lineKey} flexDirection="row">
  {/* Gutter with line number */}
  <Box
    width={gutterWidth + 1}
    paddingRight={1}
    flexShrink={0}
    backgroundColor={backgroundColor}
    justifyContent="flex-end"
  >
    <Text color={semanticTheme.text.secondary}>{gutterNumStr}</Text>
  </Box>

  {/* Line content */}
  {line.type === 'context' ? (
    <>
      <Text>{prefixSymbol} </Text>
      <Text wrap="wrap">{colorizeLine(displayContent, language)}</Text>
    </>
  ) : (
    <Text
      backgroundColor={
        line.type === 'add' ? semanticTheme.background.diff.added
                            : semanticTheme.background.diff.removed
      }
      wrap="wrap"
    >
      <Text
        color={
          line.type === 'add' ? semanticTheme.status.success
                              : semanticTheme.status.error
        }
      >
        {prefixSymbol}
      </Text>{' '}
      {colorizeLine(displayContent, language)}
    </Text>
  )}
</Box>
```

---

## Edge Case Handling

### 1. Empty Diff Content (Lines 129-131)

```typescript
if (!diffContent || typeof diffContent !== 'string') {
  return <Text color={semanticTheme.status.warning}>No diff content.</Text>;
}
```

### 2. No Changes Detected (Lines 133-143, 221-230)

```typescript
if (parsedLines.length === 0) {
  return (
    <Box
      borderStyle="round"
      borderColor={semanticTheme.border.default}
      padding={1}
    >
      <Text dimColor>No changes detected.</Text>
    </Box>
  );
}
```

### 3. New File Detection (Lines 116-126)

A file is considered "new" if ALL lines are additions (no deletions or context):

```typescript
const isNewFile = useMemo(() => {
  if (parsedLines.length === 0) return false;
  return parsedLines.every(
    (line) =>
      line.type === 'add' ||
      line.type === 'hunk' ||
      line.type === 'other' ||
      line.content.startsWith('diff --git') ||
      line.content.startsWith('new file mode'),
  );
}, [parsedLines]);
```

**New file rendering** uses full syntax highlighting via `colorizeCode()` instead of line-by-line diff rendering.

### 4. Screen Reader Accessibility (Lines 144-154)

```typescript
if (screenReaderEnabled) {
  return (
    <Box flexDirection="column">
      {parsedLines.map((line, index) => (
        <Text key={index}>
          {line.type}: {line.content}
        </Text>
      ))}
    </Box>
  );
}
```

### 5. "No Newline at End of File" (Lines 77-80)

```typescript
} else if (line.startsWith('\\')) {
  // Handle "\ No newline at end of file"
  result.push({ type: 'other', content: line });
}
```

These lines are parsed but filtered out during display (Lines 217-219):
```typescript
const displayableLines = normalizedLines.filter(
  (l) => l.type !== 'hunk' && l.type !== 'other',
);
```

### 6. SVN Diff Format Support

The tests show support for SVN-style diffs:
```
fileDiff Index: file.txt
===================================================================
--- a/file.txt   Current
+++ b/file.txt   Proposed
```

The parser handles this by skipping `---` lines (Line 48-49) and focusing on hunk headers.

### 7. Files Without Extensions (Test Lines 321-345)

When no file extension exists (e.g., `Dockerfile`):
```typescript
const fileExtension = filename?.split('.').pop() || null;
const language = fileExtension
  ? getLanguageFromExtension(fileExtension)
  : null;  // Falls back to auto-detection
```

### 8. Terminal Width Constraints

The component adapts to terminal width:
- Lines wrap with `wrap="wrap"` property
- MaxSizedBox handles overflow when height is constrained
- Gap indicators fill terminal width with `═` characters

### 9. Alternate Buffer Mode (Lines 105, 182, 286-300, 345-361)

Different rendering strategies based on terminal mode:
- **Alternate buffer**: Full scrolling support, uses proper Box borders
- **Normal mode**: MaxSizedBox truncation with "hidden lines" indicator

---

## Implementation Recommendations

### For FloMaster CLI

1. **Modular Architecture**
   ```
   packages/cli/src/components/
   ├── diffRenderer/
   │   ├── diffRenderer.tsx      # Main component
   │   ├── diffParser.ts         # Pure parsing logic
   │   ├── lineRenderer.tsx      # Individual line component
   │   ├── types.ts              # DiffLine, DiffRendererProps
   │   └── index.ts
   ```

2. **Separate Parsing from Rendering**
   - Extract `parseDiffWithLineNumbers` to a pure utility function
   - Enable unit testing of parsing logic independently
   - Allow reuse in non-CLI contexts

3. **Theme Integration**
   ```typescript
   // Use FloMaster's existing semantic token pattern
   interface DiffTheme {
     background: {
       added: string;
       removed: string;
     };
     text: {
       added: string;      // For + prefix
       removed: string;    // For - prefix
       lineNumber: string;
       separator: string;
     };
   }
   ```

4. **Language Detection Extension**
   - Add more languages based on FloMaster's target use cases
   - Consider using file-type detection library for unknown extensions
   - Support shebang detection for scripts without extensions

5. **Performance Considerations**
   - Memoize parsed lines (already done with `useMemo`)
   - Pre-calculate gutter width once per render
   - Consider virtualization for very large diffs

6. **Accessibility**
   - Implement screen reader mode from day one
   - Announce line type (added/removed/context) clearly
   - Provide summary of changes (e.g., "+5 -3 lines")

7. **Test Coverage**
   - Port the existing test cases as reference
   - Add tests for:
     - Binary file diffs (currently unsupported)
     - Rename diffs
     - Permission-only changes
     - Very long lines
     - Unicode content

8. **Key Constants**
   ```typescript
   const DEFAULT_TAB_WIDTH = 4;
   const MAX_CONTEXT_LINES_WITHOUT_GAP = 5;
   const GAP_SEPARATOR = '═';  // U+2550 BOX DRAWINGS DOUBLE HORIZONTAL
   ```

### Code Example for FloMaster

```typescript
// packages/cli/src/components/diffRenderer/types.ts
export interface DiffLine {
  type: 'add' | 'del' | 'context' | 'hunk' | 'other';
  oldLine?: number;
  newLine?: number;
  content: string;
}

export interface DiffRendererProps {
  diffContent: string;
  filename?: string;
  tabWidth?: number;
  maxHeight?: number;
  width: number;
}

// packages/cli/src/components/diffRenderer/diffParser.ts
export function parseDiff(content: string): DiffLine[] {
  // ... implementation from analysis
}

// packages/cli/src/components/diffRenderer/diffRenderer.tsx
export const DiffRenderer: React.FC<DiffRendererProps> = (props) => {
  const lines = useMemo(() => parseDiff(props.diffContent), [props.diffContent]);
  // ... rendering logic
};
```

---

## References

### Source Files Analyzed

| File | Lines | Purpose |
|------|-------|---------|
| `DiffRenderer.tsx` | 435 | Main component |
| `DiffRenderer.test.tsx` | 349 | Test cases |
| `CodeColorizer.tsx` | 280 | Syntax highlighting |
| `MaxSizedBox.tsx` | 624 | Overflow handling |
| `semantic-colors.ts` | 27 | Theme access |
| `semantic-tokens.ts` | 136 | Token definitions |
| `theme.ts` | 502 | Theme system |

### Key Line References

| Feature | File | Lines |
|---------|------|-------|
| DiffLine interface | DiffRenderer.tsx | 18-23 |
| Hunk regex | DiffRenderer.tsx | 31 |
| Line number adjustment | DiffRenderer.tsx | 40-44 |
| New file detection | DiffRenderer.tsx | 116-126 |
| Gap indicator threshold | DiffRenderer.tsx | 265 |
| Line type switch | DiffRenderer.tsx | 310-333 |
| Background colors | DiffRenderer.tsx | 337-342 |
| Language map | DiffRenderer.tsx | 415-434 |
| HAST rendering | CodeColorizer.tsx | 30-93 |
| Dark theme colors | theme.ts | 102-119 |
| Light theme colors | theme.ts | 83-100 |
