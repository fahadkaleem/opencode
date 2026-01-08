# External Integrations

**Analysis Date:** 2026-01-08

## APIs & External Services

**LLM Providers (18+ supported):**

| Provider | Package | Auth |
|----------|---------|------|
| Anthropic (Claude) | @ai-sdk/anthropic | ANTHROPIC_API_KEY |
| OpenAI | @ai-sdk/openai | OPENAI_API_KEY |
| Google Generative AI | @ai-sdk/google | GOOGLE_API_KEY |
| Google Vertex AI | @ai-sdk/google-vertex | GOOGLE_CLOUD_PROJECT, service account |
| Amazon Bedrock | @ai-sdk/amazon-bedrock | AWS_REGION, AWS_ACCESS_KEY_ID |
| Azure OpenAI | @ai-sdk/azure | AZURE_API_KEY, AZURE_ENDPOINT |
| OpenRouter | @openrouter/ai-sdk-provider | API key |
| GitHub Copilot | Custom (openai-compatible) | OAuth token |
| Mistral AI | @ai-sdk/mistral | API key |
| Groq | @ai-sdk/groq | API key |
| Perplexity | @ai-sdk/perplexity | API key |
| xAI (Grok) | @ai-sdk/xai | API key |
| Cohere | @ai-sdk/cohere | API key |
| DeepInfra | @ai-sdk/deepinfra | API key |
| Cerebras | @ai-sdk/cerebras | API key |
| TogetherAI | @ai-sdk/togetherai | API key |
| Cloudflare AI Gateway | Custom | CLOUDFLARE_API_TOKEN |

**Models.dev API:**
- Endpoint: `https://models.dev/api.json`
- Purpose: Fetches model definitions and pricing
- Cache: `~/.opencode/cache/models.json` (refreshes hourly)
- Timeout: 10 seconds

## Data Storage

**Databases:**
- None (file-based storage only)

**File Storage:**
- Local file system via Bun.file() API
- Sessions: `~/.opencode/storage/session/`
- Messages: `~/.opencode/storage/message/`
- Projects: `~/.opencode/storage/project/`
- Workflow state: `{repo}/.flomaster/executions/`
- JSON-based persistence format

**Caching:**
- In-memory Maps (bounded by session lifecycle)
- Model definitions cached locally

## Authentication & Identity

**Auth Provider:**
- OpenAuth (@openauthjs/openauth) - Custom auth layer
- File-based token storage in `~/.opencode/auth/`

**OAuth Integrations:**
- GitHub OAuth - GitHub Copilot authentication
- Google Cloud OAuth - Vertex AI service account
- Custom MCP OAuth - Per-server OAuth support

**Credentials:**
- Provider API keys via environment variables
- OAuth tokens stored in `~/.opencode/auth/`
- No password storage (delegate to OAuth providers)

## Model Context Protocol (MCP)

**SDK:** @modelcontextprotocol/sdk 1.15.1

**Transport Types:**
- HTTP streaming (StreamableHTTPClientTransport)
- Server-Sent Events (SSEClientTransport)
- Stdio for local servers (StdioClientTransport)

**Configuration:** `opencode.jsonc` under `mcp` key:
```json
{
  "mcp": {
    "server-name": {
      "type": "remote|local",
      "url": "https://...",
      "command": ["executable", "args"],
      "enabled": true,
      "oauth": true,
      "timeout": 30000
    }
  }
}
```

**Features:**
- Tool discovery and execution
- Prompt templates
- Resource reading
- Real-time tool list notifications

## Monitoring & Observability

**Error Tracking:**
- None (logging to stdout/stderr)

**Analytics:**
- None

**Logs:**
- OpenTelemetry API available
- Structured logging via `Log.create({ service: "..." })`
- Attributes: session.id, installation.id, interactive

## CI/CD & Deployment

**Hosting:**
- Self-hosted CLI tool
- Server runs locally on port 4096

**CI Pipeline:**
- GitHub Actions (.github/workflows/)
- Turbo for build orchestration

**AWS S3 (Optional):**
- @aws-sdk/client-s3 available for static file hosting
- Not required for core functionality

## Environment Configuration

**Development:**
- Required env vars: None (optional API keys for LLM access)
- Secrets location: `.env.local` (gitignored)
- Mock services: None (real providers in test mode)

**Production:**
- Same as development (local CLI tool)
- Secrets management: User's environment

## Webhooks & Callbacks

**Incoming:**
- None (no external webhook endpoints)

**Outgoing:**
- LLM API calls to configured providers
- MCP server communication

## External APIs Consumed

**GitHub API:**
- @octokit/rest 22.0.0, @octokit/graphql 9.0.2
- Purpose: OAuth, repository operations, issue tracking

**Well-known Endpoints:**
- `.well-known/opencode` for external config loading
- Auth type: wellknown with stored token

---

*Integration audit: 2026-01-08*
*Update when adding/removing external services*
