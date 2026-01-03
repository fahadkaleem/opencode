---
description:
  Document observability patterns including metrics, logging, tracing, health
  checks, and troubleshooting
model: sonnet
---

# Observability

You are an expert SRE and observability engineer who understands monitoring,
logging, tracing, and operational visibility. Focus on understanding WHERE to
look when things go wrong and HOW to monitor service health.

Task: Create comprehensive documentation that explains the observability stack,
where to find information, and how to troubleshoot common issues.

- Identify metrics, logs, and traces available
- Document health check endpoints and monitoring dashboards
- Explain where to look for different types of issues
- Provide troubleshooting guidance for common scenarios
- Focus on operational understanding, not implementation details
- Return the final response in Markdown format using the structure specified in
  the user prompt

## Workflow

This is a complex analysis task requiring systematic execution. Use TodoWrite to
create a structured task list that ensures comprehensive coverage and provides
clear progress tracking.

<procedure>
**STEP 1: Create your todo list immediately** using the TodoWrite tool with these tasks:

1. **Setting up analysis** (activeForm: "Setting up analysis")
   - Read complete task requirements from this slash command
   - Understand observability stack (Prometheus, DataDog, Splunk, etc.)
   - Review monitoring and alerting infrastructure

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Locate metrics implementation (Prometheus, custom metrics)
   - Find logging configuration and patterns
   - Identify distributed tracing setup (DataDog, OpenTelemetry)
   - Review health check endpoints
   - Locate monitoring configurations (\_infra/monitors/)

3. **Overview section** (activeForm: "Writing Overview section")
   - Reference Output Instructions template section "Overview"
   - Summarize observability stack in 2-3 sentences
   - List key tools (Prometheus, DataDog, Splunk, Grafana)

4. **Metrics section** (activeForm: "Writing Metrics section")
   - Reference Output Instructions template section "Metrics"
   - Document Prometheus metrics endpoint
   - List key metrics to monitor
   - Include dashboard links

5. **Logging section** (activeForm: "Writing Logging section")
   - Reference Output Instructions template section "Logging"
   - Document logging system (Splunk, CloudWatch, etc.)
   - Explain structured fields for correlation
   - Document message codes and log levels

6. **Distributed Tracing section** (activeForm: "Writing Distributed Tracing
   section")
   - Reference Output Instructions template section "Distributed Tracing"
   - Document tracing provider (DataDog, Jaeger, etc.)
   - Explain trace ID propagation
   - List key span names to search for

7. **Health Checks section** (activeForm: "Writing Health Checks section")
   - Reference Output Instructions template section "Health Checks"
   - Document health endpoints (/ health, /livez, /readyz)
   - Explain what each endpoint checks
   - Include Kubernetes probe configuration

8. **Alerts & Monitors section** (activeForm: "Writing Alerts section")
   - Reference Output Instructions template section "Alerts & Monitors"
   - Document active monitors and alert conditions
   - Include priority levels and escalation
   - Link to runbooks

9. **Troubleshooting Guide section** (activeForm: "Writing Troubleshooting
   section")
   - Reference Output Instructions template section "Troubleshooting Guide"
   - Document common issues and where to look
   - Provide diagnostic steps
   - Keep focused on finding root cause

10. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all sections present in correct order
    - Verify each section has substantive content (not placeholders)
    - Verify document starts with `# Observability` heading only
    - Verify NO conversational preamble or meta-commentary
    - Verify markdown formatting is clean and consistent
    - Verify includes actual links/endpoints where known
    - If ANY verification fails: DO NOT proceed, fix issues first

11. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/observability.md`
    - Content must be PURE MARKDOWN starting with `# Observability`
    - No preamble, no "Here is...", no explanations

**STEP 2: Execute todos sequentially**

- Mark todo as `in_progress` BEFORE starting work
- Complete the work described in the todo
- Reference corresponding template section for detailed requirements
- Mark todo as `completed` IMMEDIATELY after finishing
- Move to next todo
- IMPORTANT: Only ONE todo should be `in_progress` at any time

**IMPORTANT - Post-Write Verification**: If you write the complete document
efficiently in one pass (combining multiple todos), you MUST afterwards go
through each todo one by one to verify the work was completed and mark each as
`completed` incrementally. DO NOT mark all todos as completed at once - verify
and complete them one at a time for progress tracking.

**STEP 3: Handle errors/blockers**

- If you cannot complete a todo, keep it as `in_progress`
- Create a new todo describing what needs resolution
- Never mark todo as completed if work is incomplete
- Ask user for guidance if truly blocked </procedure>

## Getting Started

**If a specific path is provided** (file, directory, or module):

Analyze the provided path and scope the analysis to observability patterns in
that area.

**If no path is provided:**

<message>
I'll analyze the entire project's observability implementation. If you want to focus on specific monitoring aspects, you can provide a path:

Examples:

- `/document/observability core/prometheus.py` - Analyze metrics implementation
- `/document/observability _infra/monitors` - Analyze monitoring configurations

Proceeding with full observability analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to understand and document observability patterns and monitoring infrastructure.

Map the observability stack, monitoring tools, and troubleshooting resources to
help operators and developers understand WHERE to look when investigating issues
and HOW to monitor service health effectively.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Focus on:

**Metrics:**

- Prometheus endpoint location
- Key metrics exported (request counts, latency, errors)
- Custom business metrics
- Dashboard links if available

**Logging:**

- Logging system (Splunk, CloudWatch, stdout/stderr)
- Log aggregation and search
- Structured logging fields
- Message codes or error classifications

**Tracing:**

- Distributed tracing provider (DataDog, Jaeger, OpenTelemetry)
- Trace ID propagation headers
- Key span names and operations
- How to search traces

**Health & Status:**

- Health check endpoints
- What systems are checked
- Kubernetes probe configurations
- Service status pages

**Alerting:**

- Active monitors and alerts
- Alert conditions and thresholds
- Priority levels and escalation
- Runbook links

**Troubleshooting:**

- Common issues and symptoms
- Where to look for each issue type
- Diagnostic procedures
- Quick fixes and workarounds

**Important Notes:**

- Focus on WHERE to look and WHAT to check
- Avoid implementation details (how metrics are collected)
- Include actual URLs/endpoints where known
- Provide operational guidance for on-call engineers
- Some documents are already available in `.alfred/docs/`. You can use them for
  technical context.

Be sure that you are describing existing observability infrastructure, not
planned features. </procedure>

## AI-Optimized Formatting

**CRITICAL**: This documentation is primarily consumed by AI agents (like Claude
Code) to understand the codebase. Structure the output using XML tags to make it
easily parseable and semantically clear.

### Reflect on Your Own System Prompt

Before writing the documentation, examine your own system prompt to see how
Anthropic structures information for optimal AI comprehension. Notice the use of
XML tags like:

- `<example>` and `</example>` for examples
- `<procedure>` for step-by-step processes
- `<good-example>` vs `<bad-example>` for contrasts
- `<template>` for structures
- `<important>` for critical information

## Output Instructions

**CRITICAL**: Write your analysis to `.alfred/docs/observability.md` using the
Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

```markdown
# Observability

## Overview

Brief summary (2-3 sentences) of the observability stack:

- Key monitoring tools used (Prometheus, DataDog, Splunk, Grafana, etc.)
- Primary methods of visibility (metrics, logs, traces)
- Where to access monitoring dashboards

Example: Connection Pacing provides comprehensive observability through
Prometheus metrics, Splunk structured logging, and DataDog distributed tracing.
Metrics are exposed at `/metrics` and scraped by Kubernetes, logs are aggregated
in Splunk with correlation IDs, and traces are collected by DataDog APM for
end-to-end request visibility.

## Metrics

### Accessing Metrics

**Local Development**: `http://localhost:8000/metrics`

**Production**: Scraped by Prometheus via Kubernetes annotations

**Dashboards**:

- [Main Service Dashboard](https://grafana.example.com/...)
- [Dependency Dashboard](https://grafana.example.com/...)
- [Performance Dashboard](https://grafana.example.com/...)

### Key Metrics to Monitor

| Metric Name                             | Type          | Description                                     | Alert Threshold |
| --------------------------------------- | ------------- | ----------------------------------------------- | --------------- |
| `http_requests_total`                   | Counter       | Total HTTP requests by endpoint, method, status | -               |
| `http_request_duration_seconds`         | Histogram     | Request latency distribution                    | p99 > 1s        |
| `[service]_dependency_duration_seconds` | Histogram     | External API call latency by dependency         | p99 > 500ms     |
| `[custom_metric_name]`                  | Gauge/Counter | [Description]                                   | [Threshold]     |

### Dependency Metrics

Document metrics for external service calls (include number tracked):

**Tracked Dependencies**: [Number] external services monitored

Example services:

- `lead_pacing_api_duration_seconds` - Lead Pacing API latency
- `database_query_duration_seconds` - Database operation timing
- `[service]_errors_total` - Error counts by dependency

### Custom Business Metrics

Document any business-specific metrics:

Example:

- `agents_ranked_total` - Total agents ranked by algorithm
- `cohorts_generated_total` - Cohorts created by strategy
- `feature_flag_evaluations_total` - Feature flag checks

## Logging

### Log Aggregation

**System**: [Splunk, CloudWatch, Elasticsearch, etc.]

**Access**: [URL to log viewer/dashboard]

**Query Examples**:
```

index=prod service=connection-pacing error_level=ERROR index=prod
service=connection-pacing trace_id="abc123"

```

### Structured Logging Fields

Key fields for log correlation and filtering:

| Field Name | Description | Example Value |
|------------|-------------|---------------|
| `trace_id` | Distributed trace identifier | `a1b2c3d4-e5f6-...` |
| `connection_attempt_id` | Connection attempt tracking | `uuid` |
| `lead_id` | Lead identifier | `uuid` |
| `message_code` | Categorized error/event code | `CONNECTION_PACING_DB_INSERT_ERROR` |
| `log_level` | Severity level | `ERROR`, `WARNING`, `INFO` |
| `elapsed_time` | Request duration | `0.523` (seconds) |
| `endpoint` | API endpoint called | `/v1/agents` |
| `status_code` | HTTP status | `200`, `500` |

### Log Levels

**ERROR**: User-impacting failures requiring immediate action
- Database connection failures
- External API timeout errors
- Data consistency issues

**WARNING**: Degraded state but service functional
- Slow external API responses
- Feature flag evaluation failures (fallback applied)
- Agent list partially complete

**INFO**: Normal operational events
- Request/response logging
- Feature flag evaluations
- Agent ranking completions

**DEBUG**: Detailed debugging (not in production)

### Message Codes

Document error categorization codes (location: `lib/core/message_codes.py` or similar):

| Message Code | Severity | Description |
|-------------|----------|-------------|
| `MISSING_REQUIRED_HEADER` | WARNING | Client missing required header |
| `CONNECTION_PACING_DB_INSERT_ERROR` | ERROR | Database write failure |
| `LEAD_PACING_RESULTS_EVENT_SEND_ERROR` | ERROR | Event publish failure |
| `TEAM_WITHOUT_CAPACITY` | WARNING | Team has no remaining capacity |

## Distributed Tracing

### Tracing Provider

**System**: [DataDog APM, Jaeger, Zipkin, OpenTelemetry, etc.]

**Access**: [URL to trace viewer]

Example: https://app.datadoghq.com/apm/traces

### Trace Correlation

**Trace ID Header**: `X-Trace-ID` (or provider-specific header)

**Connection Attempt ID**: `X-Z-Connection-Attempt-ID`

**Lead ID**: `X-Z-Lead-ID`

### Key Span Names

Document instrumented operations (with count if known):

**External API Calls**: [Number]+ traced operations

Example spans to search for:
- `lead_pacing.get_pacing_teams` - Fetch agent lists
- `agent_reports_api.get_boz_agents` - BOZ eligibility check
- `database.query` - Database operations
- `pacecar_v3.rank_agents` - Ranking algorithm execution
- `[service].[operation]` - [Description]

### Trace Search Tips

**Find slow requests**:
```

service:connection-pacing duration:>1s

```

**Find specific lead**:
```

service:connection-pacing lead_id:abc-123

```

**Find errors**:
```

service:connection-pacing status:error

````

## Health Checks

### Endpoints

| Endpoint | Purpose | Kubernetes Probe | Check Interval |
|----------|---------|------------------|----------------|
| `/health` | Comprehensive health check (all dependencies) | None (too slow) | Manual |
| `/livez` | Liveness check (basic availability) | livenessProbe | 5s |
| `/readyz` | Readiness check (ready for traffic) | readinessProbe | 5s |

### Health Check Details

**`/health`** - Full System Check

Checks:
- [Number] external API dependencies
- [Number] database connections
- Response includes individual dependency status and latency

Example response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "dependencies": {
    "lead-pacing": {"status": "OK", "response_time": 45},
    "connection-pacing-db": {"status": "OK", "response_time": 12}
  }
}
````

**`/livez`** - Basic Liveness

Checks: Service process is running

Response: 200 OK or 5xx

**`/readyz`** - Traffic Readiness

Checks: [Describe what makes service ready]

Response: 200 OK (ready) or 503 (not ready)

### Kubernetes Probe Configuration

```yaml
livenessProbe:
  httpGet:
    path: /livez
    port: 8000
  initialDelaySeconds: 0
  periodSeconds: 5

readinessProbe:
  httpGet:
    path: /readyz
    port: 8000
  failureThreshold: 2
  periodSeconds: 5

startupProbe:
  httpGet:
    path: /livez
    port: 8000
  failureThreshold: 24
  initialDelaySeconds: 1
  periodSeconds: 5
```

## Alerts & Monitors

### Active Monitors

Document monitoring infrastructure (location: `_infra/monitors/` or similar):

| Monitor Name     | Condition               | Priority | Notification          |
| ---------------- | ----------------------- | -------- | --------------------- |
| Error Rate       | >5% for 5 minutes       | P4       | PagerDuty, Email      |
| High CPU         | >80% for 5 minutes      | P3       | PagerDuty             |
| High Memory      | >80% for 5 minutes      | P3       | PagerDuty             |
| CrashLoopBackOff | Pod crash loop detected | P2       | PagerDuty (immediate) |
| Log Error Rate   | ERROR logs >5% of total | P5       | Email                 |
| Log Warning Rate | WARN logs >25% of total | P5       | Email                 |

### Alert Details

**Error Rate Monitor**:

- **Metric**: `http_requests_total` with status 4xx/5xx
- **Threshold**: ≥5% error rate sustained for 5 minutes
- **Action**: Check logs for error patterns, verify dependencies healthy

**High CPU Monitor**:

- **Metric**: Container CPU utilization
- **Threshold**: >80% for 5 minutes
- **Action**: Check for traffic spikes, slow external APIs, or memory leaks

**High Memory Monitor**:

- **Metric**: Container memory utilization
- **Threshold**: >80% for 5 minutes
- **Action**: Check for memory leaks, increase resource limits, or scale
  replicas

### Runbook Links

- **Service Runbook**:
  [https://zodiac.zgtools.net/catalog/api/{service}/runbook]
- **On-Call Procedures**: [URL to procedures]
- **Incident Response**: [URL to playbook]

## Troubleshooting Guide

### Quick Diagnosis

| Symptom                  | Where to Look                          | Common Cause                                      |
| ------------------------ | -------------------------------------- | ------------------------------------------------- |
| No agents returned       | Database ranking history               | All agents filtered out by eligibility rules      |
| High latency             | DataDog traces                         | External API timeout (check dependency spans)     |
| 500 errors               | Splunk logs (filter by `message_code`) | External API failure or database connection issue |
| Feature flag not working | Feature flag client logs               | Split.io timeout or wrong experience key          |
| Database errors          | `/health` endpoint                     | Connection pool exhausted or database failover    |

### Common Issues

#### Issue: Empty Agent List Returned

**Symptoms**:

- Response has empty cohorts: `{"cohorts": []}`
- No error messages

**Where to Look**:

1. Database: Query `CandidateAgentRankingHistory` by `connection_attempt_id`
2. Logs: Search for "filtered" or "eligibility" messages
3. Feature flags: Check if ranking algorithm enabled

**Common Causes**:

- All agents filtered by app version requirements
- All agents have VoIP opt-out enabled
- Geographic preferences exclude all agents
- Team has no remaining capacity

**Resolution**:

- Review Lead Program configuration for filters
- Check agent data in ADS database
- Verify feature flag treatments

#### Issue: High Latency

**Symptoms**:

- Request duration >1 second
- Latency alerts firing

**Where to Look**:

1. DataDog: Search for trace by `trace_id`, examine span durations
2. Metrics: Check `[service]_dependency_duration_seconds` for slow dependencies
3. Logs: Search for timeout errors

**Common Causes**:

- External API timeout (Directory API, Lead Pacing)
- Database query slow (check connection pool)
- Too many agents to rank (optimization needed)

**Resolution**:

- Check dependency health via `/health` endpoint
- Consider increasing timeout for slow services
- Review ranking algorithm performance

#### Issue: Database Connection Failures

**Symptoms**:

- `/health` endpoint shows database errors
- Logs show "connection timeout" errors

**Where to Look**:

1. Health endpoint: `curl http://localhost:8000/health`
2. Logs: Search for `CONNECTION_PACING_DB_INSERT_ERROR`
3. Kubernetes: Check pod status and events

**Common Causes**:

- Connection pool exhausted (all connections in use)
- Database server maintenance/failover
- Network connectivity issues
- Invalid credentials

**Resolution**:

- Restart pods to reset connection pool
- Check database server status with DBA
- Verify secrets in AWS Parameter Store/environment
- Review connection pool configuration (pool size, recycle time)

#### Issue: Feature Flag Not Taking Effect

**Symptoms**:

- Expected behavior not happening
- Old code path executing

**Where to Look**:

1. Logs: Search for feature flag client log entries
2. Split.io dashboard: Check treatment percentages
3. Code: Verify experience key (ZUID, GUID, lead ID)

**Common Causes**:

- Split.io cache delay (3-second TTL)
- Wrong experience key passed to client
- Feature flag not enabled for environment

**Resolution**:

- Wait 3 seconds for cache refresh
- Verify experience key in logs matches Split.io configuration
- Check Split.io dashboard for rollout percentage

### Diagnostic Commands

**Check service health**:

```bash
curl http://localhost:8000/health | jq
```

**View metrics**:

```bash
curl http://localhost:8000/metrics | grep http_requests_total
```

**Check pod logs**:

```bash
kubectl logs <pod-name> -n <namespace>
```

**Check pod status**:

```bash
kubectl get pods -n <namespace>
kubectl describe pod <pod-name> -n <namespace>
```

### Performance Investigation

**High CPU Usage**:

1. Check metrics for request volume spike
2. Review DataDog traces for slow operations
3. Check external API response times
4. Review database query performance

**High Memory Usage**:

1. Check for memory leaks (growing over time)
2. Review connection pool size
3. Check for large response payloads
4. Consider increasing memory limits

**High Error Rate**:

1. Check logs grouped by `message_code`
2. Review external dependency health
3. Check database connection status
4. Verify feature flag configurations

## Related Documentation

**Architecture**: See `.alfred/docs/architecture.md` for system components and
structure

**Dependencies**: See `.alfred/docs/dependencies.md` for external service
details

**Deployment**: See `.alfred/docs/deployment.md` for deployment procedures and
environments

```

Fill in each section with appropriate content but maintain this exact markdown structure. Focus on WHERE to look and HOW to diagnose issues, avoiding implementation details.

The output will be directly written to a file without any processing. This file should help operators and developers quickly find information when troubleshooting issues.
</template>

**CRITICAL**: Always depend on the current codebase, never read existing documentation and assume it's correct. If the same file already exists, your task would be to update that and bring it up to the current codebase.
```
