# Security Rules

## Input Validation

- Validate external input at boundaries with Zod
- String fields must have `max()` constraints
- Reject `../` path traversal attempts
- URLs: allow only `http:` and `https:` protocols

## Command Execution

```typescript
// GOOD - args array
execFile('git', ['log', '--oneline', '-n', count]);

// BAD - shell string (injection risk)
exec(`git log --oneline -n ${count}`);
```

- Use `execFile` with args array, never `exec` with strings
- Use `shell: false` in spawn options

## Error Disclosure

- Never expose stack traces to users
- Never expose internal file paths
- Log sensitive details internally only
