# Observability Rules

## Logging

- Use OpenTelemetry logging API
- Use structured logging with `LogRecord`
- Include attributes: `session.id`, `installation.id`, `interactive`

## Metrics

- Counters for discrete events (requests, errors)
- Histograms for measurements (latency, sizes)
