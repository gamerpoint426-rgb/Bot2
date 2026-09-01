# Controlled Minecraft Benchmark Harness

This package is a **planning and monitoring harness**, not a botnet or mass-connection client.

## Purpose
Use it to organize an authorized capacity test of infrastructure you control.

## What it does
- Defines staged test plans (25 → 50 → 100 → 150 → 200)
- Records operator observations and server metrics
- Provides a local HTTP metrics receiver for manually submitted samples
- Includes stop criteria and a runbook

## What it does NOT do
- Generate Minecraft protocol clients
- Flood a server
- Bypass bot protection
- Target arbitrary hosts

## Quick start
```bash
python metrics_receiver.py
```

Then open another terminal and submit a sample:
```bash
curl -X POST http://127.0.0.1:8080/metric \
  -H "Content-Type: application/json" \
  -d '{"stage":25,"cpu_percent":42,"ram_mb":2100,"tps":20,"latency_ms":35}'
```

Results are written to `metrics.jsonl`.

Review `test-plan.yaml` and `RUNBOOK.md` before testing.
