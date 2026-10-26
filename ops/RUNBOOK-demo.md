# Demo runbook: savings-api on-call alert

Synthetic only. No real monitoring, clusters or AT&T systems are involved.

## Fire the alert

```
python3 ops/fire-alert.py
```

Needs `SLACK_WEBHOOK_ATT_ALERTS` (the #att-alerts incoming webhook; in Devin it is an org secret).
The message lands in #att-alerts and Devin OnCall picks it up. Expect a thread reply with root
cause and blast radius, then a fix PR with a regression test. A human approves the merge.

## Reset after a rehearsal

1. Close the OnCall fix PR without merging and delete its branch.
2. Leave `main` as it is. The regression stays on `main` for the next run.
3. Optionally delete the alert message and thread in #att-alerts.

## Local repro

```
npm install && npm run build && npm start
```

Sign in as Finance approver and approve a pending Fleet event.
