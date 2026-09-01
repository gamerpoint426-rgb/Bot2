# Controlled Test Runbook

## Before starting
1. Confirm written authorization for the infrastructure being tested.
2. Take a backup and document the baseline CPU/RAM/TPS.
3. Ensure an administrator can immediately stop the test.
4. Configure monitoring before generating any authorized test traffic.
5. Start at the lowest stage.

## During each stage
Record:
- CPU %
- RAM used
- TPS
- latency
- disconnects/errors
- proxy/backend logs

Do not advance automatically. Review stability after every stage.

## Stop immediately if
- TPS remains below the chosen threshold
- CPU or RAM is sustained near saturation
- networking becomes unstable
- legitimate users are affected

## After testing
Return the system to normal operation and review logs for bottlenecks.
