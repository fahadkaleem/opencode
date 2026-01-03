---
# No paths - this is reference documentation that's useful throughout development
---

# Data Fetching Guidelines

> Rules for creating queries and mutations using TanStack Query and Axios. Read this when implementing data fetching in `api/` folders.

---

## Context

Data fetching is separate from AI SDK code. Use TanStack Query for server state (caching, background refetching, optimistic updates) and Axios for HTTP requests. Consistent patterns enable copy-paste to production and automatic cache invalidation across the app.

---

## File Structure

```
features/[feature]/api/
├── get-[resource].ts           # Query: fetch single
├── get-[resource]s.ts          # Query: fetch list
├── create-[resource].ts        # Mutation: create
├── update-[resource].ts        # Mutation: update
├── delete-[resource].ts        # Mutation: delete
└── index.ts                    # Public API exports

lib/
├── api-client.ts               # Axios instance with interceptors
├── api-error.ts                # Custom APIError class
└── react-query.ts              # QueryClient configuration
```

---

## Code Order

1. Imports (TanStack Query, Zod, api-client, types)
2. Types (response type, params type, input schema)
3. Constants (query keys, default values)
4. Functions (fetcher, queryOptions, hook)
5. Exports (named only)

---

## Naming

### Files

| Operation | File Name | Example |
|-----------|-----------|---------|
| Get single | `get-[resource].ts` | `get-message.ts` |
| Get list | `get-[resource]s.ts` | `get-messages.ts` |
| Create | `create-[resource].ts` | `create-message.ts` |
| Update | `update-[resource].ts` | `update-message.ts` |
| Delete | `delete-[resource].ts` | `delete-message.ts` |

### Functions

| Type | Pattern | Example |
|------|---------|---------|
| Fetcher | `get[Resource]` / `get[Resource]s` | `getMessage`, `getMessages` |
| Query options | `get[Resource]QueryOptions` | `getMessageQueryOptions` |
| Query hook | `use[Resource]` / `use[Resource]s` | `useMessage`, `useMessages` |
| Mutation fn | `create[Resource]` / `update[Resource]` / `delete[Resource]` | `createMessage` |
| Mutation hook | `useCreate[Resource]` / `useUpdate[Resource]` / `useDelete[Resource]` | `useCreateMessage` |

### Query Keys

| Pattern | Example |
|---------|---------|
| List | `['messages']`, `['messages', { conversationId }]` |
| Single | `['messages', messageId]` |
| Nested | `['conversations', conversationId, 'messages']` |

### Types

| Item | Convention | Example |
|------|------------|---------|
| Response type | `[Resource]` | `Message` |
| List response | `[Resource]sResponse` | `MessagesResponse` |
| Input schema | `create[Resource]InputSchema` | `createMessageInputSchema` |
| Input type | `Create[Resource]Input` | `CreateMessageInput` |
| Hook options | `Use[Resource]Options` | `UseMessageOptions` |

---

<rules>

## Do

- One query/mutation per file
- Use `queryOptions()` factory for all queries (enables prefetching)
- Use Zod for mutation input validation
- Invalidate related queries in mutation `onSuccess`
- Use array query keys with hierarchical structure
- Type all responses, inputs, and hook options explicitly

## Don't

- Inline query config in useQuery → Use `queryOptions()` factory
- String query keys → Use array keys `['resource', id]`
- Skip cache invalidation in mutations → Always invalidate in `onSuccess`
- Direct API calls in components → Use query/mutation hooks
- Hardcode API URLs → Use configured Axios client

## When

- WHEN fetching single resource → Use `enabled: Boolean(id)` to prevent empty requests
- WHEN mutation succeeds → Invalidate list queries, optionally update single item cache
- WHEN deleting → Use `removeQueries` for immediate cache removal
- WHEN optimistic UI needed → Use `onMutate` for instant feedback with rollback

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
npm run test -- [name] # Run specific tests
```

---

<example>

## Complete Example

A conversations feature with list query, single query, and create mutation. Demonstrates: queryOptions, cache invalidation, Zod validation, typed hooks.

```typescript
// ============================================================
// FILE: src/lib/api-client.ts
// Demonstrates: Shared Axios configuration
// ============================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';

// ------------------------------------------------------------
// API ERROR CLASS
// ------------------------------------------------------------
class APIError extends Error {                                  // Rule: Custom error class
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }

  isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

// ------------------------------------------------------------
// AXIOS INSTANCE
// ------------------------------------------------------------
const api = axios.create({
  baseURL: env.API_URL,                                         // Rule: Use configured client
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,                                  // Rule: Extract data
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const message = (error.response?.data as { message?: string })?.message ?? error.message;
    return Promise.reject(new APIError(message, status, error.response?.data));
  }
);

export { api, APIError };
```

```typescript
// ============================================================
// FILE: src/lib/react-query.ts
// Demonstrates: QueryClient configuration
// ============================================================

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

import { APIError } from './api-client';

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type QueryConfig<T extends (...args: never[]) => unknown> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;

type MutationConfig<MutationFnType extends (...args: never[]) => Promise<unknown>> = {
  onSuccess?: (data: Awaited<ReturnType<MutationFnType>>) => void;
  onError?: (error: APIError) => void;
  onSettled?: () => void;
};

// ------------------------------------------------------------
// QUERY CLIENT
// ------------------------------------------------------------
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60,                                       // 1 minute
    gcTime: 1000 * 60 * 5,                                      // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        return false;                                           // Don't retry client errors
      }
      return failureCount < 3;
    },
  },
  mutations: {
    retry: false,
  },
};

const queryClient = new QueryClient({ defaultOptions });

export { queryClient, defaultOptions };
export type { QueryConfig, MutationConfig };
```

```typescript
// ============================================================
// FILE: src/features/conversations/api/get-conversation.ts
// Demonstrates: Single resource query
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { queryOptions, useQuery } from '@tanstack/react-query';  // Rule: TanStack Query first

import { api } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
type Conversation = {                                           // Rule: Type response
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

// ------------------------------------------------------------
// 3. CONSTANTS
// ------------------------------------------------------------
const CONVERSATIONS_QUERY_KEY = 'conversations';                // Rule: Query key constant

// ------------------------------------------------------------
// 4. FUNCTIONS
// ------------------------------------------------------------
function getConversation(conversationId: string): Promise<Conversation> {
  return api.get(`/conversations/${conversationId}`);           // Rule: Use api client
}

function getConversationQueryOptions(conversationId: string) {  // Rule: queryOptions factory
  return queryOptions({
    queryKey: [CONVERSATIONS_QUERY_KEY, conversationId],        // Rule: Array query key
    queryFn: () => getConversation(conversationId),
    enabled: Boolean(conversationId),                           // Rule: Prevent empty requests
  });
}

type UseConversationOptions = {                                 // Rule: Type hook options
  conversationId: string;
  queryConfig?: QueryConfig<typeof getConversationQueryOptions>;
};

function useConversation({ conversationId, queryConfig }: UseConversationOptions) {
  return useQuery({
    ...getConversationQueryOptions(conversationId),             // Rule: Spread queryOptions
    ...queryConfig,
  });
}

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { getConversation, getConversationQueryOptions, useConversation, CONVERSATIONS_QUERY_KEY };
export type { Conversation, UseConversationOptions };
```

```typescript
// ============================================================
// FILE: src/features/conversations/api/get-conversations.ts
// Demonstrates: List query with pagination
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { Conversation } from './get-conversation';
import { CONVERSATIONS_QUERY_KEY } from './get-conversation';

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

type ConversationsResponse = {                                  // Rule: [Resource]sResponse
  data: Conversation[];
  meta: PaginationMeta;
};

type GetConversationsParams = {
  page?: number;
  perPage?: number;
};

// ------------------------------------------------------------
// 3. CONSTANTS
// ------------------------------------------------------------
const DEFAULT_PARAMS: Required<GetConversationsParams> = {
  page: 1,
  perPage: 20,
};

// ------------------------------------------------------------
// 4. FUNCTIONS
// ------------------------------------------------------------
function getConversations(params: GetConversationsParams = {}): Promise<ConversationsResponse> {
  return api.get('/conversations', { params: { ...DEFAULT_PARAMS, ...params } });
}

function getConversationsQueryOptions(params: GetConversationsParams = {}) {
  return queryOptions({
    queryKey: [CONVERSATIONS_QUERY_KEY, params],                // Rule: Include params in key
    queryFn: () => getConversations(params),
  });
}

type UseConversationsOptions = {
  params?: GetConversationsParams;
  queryConfig?: QueryConfig<typeof getConversationsQueryOptions>;
};

function useConversations({ params, queryConfig }: UseConversationsOptions = {}) {
  return useQuery({
    ...getConversationsQueryOptions(params),
    ...queryConfig,
  });
}

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { getConversations, getConversationsQueryOptions, useConversations };
export type { ConversationsResponse, GetConversationsParams, UseConversationsOptions, PaginationMeta };
```

```typescript
// ============================================================
// FILE: src/features/conversations/api/create-conversation.ts
// Demonstrates: Create mutation with cache invalidation
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';                                        // Rule: Zod for validation

import { api } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { Conversation } from './get-conversation';
import { CONVERSATIONS_QUERY_KEY } from './get-conversation';

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
const createConversationInputSchema = z.object({                // Rule: Zod input schema
  title: z.string().min(1, 'Title is required'),
  initialMessage: z.string().optional(),
});

type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

// ------------------------------------------------------------
// 3. CONSTANTS
// ------------------------------------------------------------
// (none needed for mutations)

// ------------------------------------------------------------
// 4. FUNCTIONS
// ------------------------------------------------------------
function createConversation(data: CreateConversationInput): Promise<Conversation> {
  return api.post('/conversations', data);
}

type UseCreateConversationOptions = {
  mutationConfig?: MutationConfig<typeof createConversation>;
};

function useCreateConversation({ mutationConfig }: UseCreateConversationOptions = {}) {
  const queryClient = useQueryClient();                         // Rule: Get queryClient

  const { onSuccess, onError, onSettled, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: createConversation,
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({                           // Rule: Invalidate on success
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
      onSuccess?.(data);
    },
    onError,
    onSettled,
    ...restConfig,
  });
}

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { createConversation, createConversationInputSchema, useCreateConversation };
export type { CreateConversationInput, UseCreateConversationOptions };
```

```typescript
// ============================================================
// FILE: src/features/conversations/api/delete-conversation.ts
// Demonstrates: Delete mutation with cache removal
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import { CONVERSATIONS_QUERY_KEY } from './get-conversation';

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
type DeleteConversationInput = {
  conversationId: string;
};

// ------------------------------------------------------------
// 4. FUNCTIONS
// ------------------------------------------------------------
function deleteConversation({ conversationId }: DeleteConversationInput): Promise<void> {
  return api.delete(`/conversations/${conversationId}`);
}

type UseDeleteConversationOptions = {
  mutationConfig?: MutationConfig<typeof deleteConversation>;
};

function useDeleteConversation({ mutationConfig }: UseDeleteConversationOptions = {}) {
  const queryClient = useQueryClient();

  const { onSuccess, onError, onSettled, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, variables) => {
      queryClient.removeQueries({                               // Rule: Remove from cache
        queryKey: [CONVERSATIONS_QUERY_KEY, variables.conversationId],
      });
      queryClient.invalidateQueries({                           // Rule: Invalidate list
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
      onSuccess?.(_);
    },
    onError,
    onSettled,
    ...restConfig,
  });
}

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { deleteConversation, useDeleteConversation };
export type { DeleteConversationInput, UseDeleteConversationOptions };
```

```typescript
// ============================================================
// FILE: src/features/conversations/api/index.ts
// Demonstrates: Feature API barrel exports
// ============================================================

// Queries
export { getConversation, getConversationQueryOptions, useConversation, CONVERSATIONS_QUERY_KEY } from './get-conversation';
export type { Conversation, UseConversationOptions } from './get-conversation';

export { getConversations, getConversationsQueryOptions, useConversations } from './get-conversations';
export type { ConversationsResponse, GetConversationsParams, UseConversationsOptions, PaginationMeta } from './get-conversations';

// Mutations
export { createConversation, createConversationInputSchema, useCreateConversation } from './create-conversation';
export type { CreateConversationInput, UseCreateConversationOptions } from './create-conversation';

export { deleteConversation, useDeleteConversation } from './delete-conversation';
export type { DeleteConversationInput, UseDeleteConversationOptions } from './delete-conversation';
```

</example>
