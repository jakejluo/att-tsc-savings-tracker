#!/usr/bin/env python3
"""Post the synthetic savings-api alert to #att-alerts via Slack incoming webhook.

Usage: SLACK_WEBHOOK_ATT_ALERTS=https://hooks.slack.com/... python3 ops/fire-alert.py
"""
import json
import os
import pathlib
import sys
import urllib.request

REPO = "jakejluo/att-tsc-savings-tracker"
LOG_FILE = pathlib.Path(__file__).parent / "sample-logs" / "approve-500.log"
ALERT = "ALERT: savings-api 5xx rate 18% on POST /events/:id/approve (category=Fleet), last 10 min"

webhook = os.environ.get("SLACK_WEBHOOK_ATT_ALERTS")
if not webhook:
    sys.exit("Set SLACK_WEBHOOK_ATT_ALERTS to the #att-alerts incoming webhook URL")

sample = "\n".join(LOG_FILE.read_text().splitlines()[:6])
text = (
    f":rotating_light: *{ALERT}*\n"
    f"*Service:* savings-api   *Environment:* prod, synthetic\n"
    f"*Repository:* https://github.com/{REPO}\n"
    f"*Logs:* `ops/sample-logs/approve-500.log` in the repo\n"
    f"*Sample log lines:*\n```{sample}```"
)

req = urllib.request.Request(
    webhook, data=json.dumps({"text": text}).encode(), headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    print(f"Slack responded {resp.status}: alert posted to #att-alerts")
