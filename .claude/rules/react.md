---
paths: **/*.tsx
---

# React Component Rules

## Example

```tsx
interface BannerProps {
  title: string;
  variant?: 'info' | 'warning';
  onDismiss: () => void;
}

const Banner = ({
  title,
  variant = 'info',
  onDismiss,
}: BannerProps): JSX.Element => {
  // Event handler, not useEffect
  const handleClick = () => {
    onDismiss();
  };

  return (
    <Box flexDirection="column">
      <Text color={variant === 'warning' ? 'yellow' : 'blue'}>{title}</Text>
      <Button onPress={handleClick}>Dismiss</Button>
    </Box>
  );
};
```

## Components

- Functional components only - no class components
- Use arrow functions with destructured props
- Define props interface above component
- Keep components pure - no side effects during render

## Hooks

- Follow Rules of Hooks (top-level, unconditional)
- Prefer event handlers over `useEffect`
- Never call `setState` inside `useEffect`
- Skip manual `useMemo`/`useCallback` - React Compiler handles it

## Architecture

- Never import React/Ink in `packages/core/`
- CLI folders: `ui/components/`, `ui/contexts/`, `ui/hooks/`, `ui/layouts/`,
  `commands/`, `config/`
