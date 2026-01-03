# Error Handling Rules

## Example

```typescript
async function loadFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error: unknown) {
    // Safe Node.js error check
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new FatalInputError(`File not found: ${path} (${error.code})`);
    }
    // Safe message extraction for logging
    logger.error('Load failed', { path, error: getErrorMessage(error) });
    throw error; // Rethrow unexpected errors
  }
}
```

## Safe Patterns

- Use `isNodeError(err)` before accessing `err.code`
- Use `getErrorMessage(err)` for safe message extraction
- Never access `.message` directly on `unknown` errors

## Error Classes

Use the appropriate error class:

- `FatalError` - base fatal error
- `FatalAuthenticationError`, `FatalInputError`, `FatalConfigError`
- `CanceledError` - operation cancellation
- `ToolErrorType` enum - tool-specific errors

## Messages

- Include error code: `(${error.code})`
- Add context: file path, operation name
- Never expose stack traces to users

## Don'ts

- Never `catch {}` or `catch { }` - swallows errors
- Never `catch (e) { return e.message }` - unsafe
- Always handle or rethrow - never swallow silently
