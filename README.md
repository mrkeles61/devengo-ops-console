# Devengo Ops Console

A programmable payment operations platform built on [Devengo](https://devengo.com)'s instant A2A payments API.

## What It Does

- **Payment Dashboard** — Real-time payment monitoring with success rates, error analytics, and live event feed
- **Smart Retry Monitor** — Configurable retry rules with error classification and recovery tracking
- **Reconciliation Engine** — Auto-match incoming payments to expected business records
- **Webhook Health** — Monitor webhook delivery rates, response times, and payload inspection
- **Balance Watchdog** — Automated balance monitoring with configurable sweep rules
- **Automations** — 3 Supabase Edge Functions + 7 n8n workflows for end-to-end payment automation

## Tech Stack

React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui + Recharts + Supabase + Devengo Sandbox API

## Quick Start

```bash
git clone <repo-url>
cd devengo-ops-console
npm install
cp .env.example .env  # fill in your keys
npm run dev
```

Open http://localhost:5173

## Supabase Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `devengo-webhook-receiver` | POST webhook (no JWT) | Receives Devengo events, auto-reconciles, handles failures |
| `balance-watchdog` | Manual / pg_cron | Checks balance rules, triggers sweeps and alerts |
| `daily-digest` | Manual / pg_cron | Generates daily payment summary report |

## n8n Workflows

Import the JSON files from `/n8n-workflows` into your n8n instance:

| Workflow | Trigger | What It Does |
|----------|---------|-------------|
| Client Onboarding | Webhook | Account holder + KYB + IBAN + test payment in 60s |
| Daily Sales Report | Cron 08:00 | Branded HTML report to CEO every morning |
| Failure Alerts | Webhook | Classifies errors, routes critical to email |
| Invoice Reconciliation | Webhook | Auto-matches payments to business records |
| Bulk Payment Processor | Webhook | Rate-limited batch processing with reporting |
| Competitive Monitor | Cron Mon 09:00 | Weekly briefing with internal vs competitor stats |
| Balance Sweep | Cron 30min | Auto-sweeps excess funds, alerts on low balances |

## Built By

Eren Keles — AI Automation Specialist
