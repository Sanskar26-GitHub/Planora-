# Planora — Every event, thoughtfully planned.

Planora is a production-minded GenAI event planning application built with React 19, TypeScript, Express, Tailwind CSS v4, and Google's official `@google/genai` SDK. It transforms event requirements into personalized, actionable plans with deterministic budgets, dependency-aware timelines, vendor contract ledgers, and Gemini-powered plan adjustments with human-in-the-loop confirmation.

---

## 1. Product Overview

- **Product Name**: Planora
- **Tagline**: *Every event, thoughtfully planned.*
- **Target Verticals**:
  1. **Weddings**: Traditional, contemporary, interfaith, and multi-day ceremonies with custom cultural rituals and dining styles.
  2. **Birthdays**: Milestone celebrations, age-bracket experiences, thematic styling, and entertainment bookings.
  3. **Community Events**: Public festivals, municipal permits, volunteer coordination, staging, AV, and safety protocols.
- **Audience**: Single-user event planners, couples, and community coordinators managing one or multiple concurrent celebrations.

---

## 2. Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (SPA)                     │
│  React 19 · TypeScript · Tailwind CSS v4 · Lucide Icons    │
│  - Dashboard & Event Portfolio                              │
│  - Event Creation Wizard with Step Validation               │
│  - Deterministic Budget & Expense Ledger                    │
│  - Dependency-Aware Timeline & Task Management              │
│  - Vendor Contract & Balance Directory                     │
│  - AI Planning Assistant (Proposal Confirmation Modal)     │
│  - Publication-Ready Event Brief (Print / PDF)             │
│  - Local Persistence & JSON Backup Import/Export           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (Internal API)
┌──────────────────────────────▼──────────────────────────────┐
│                    Server Layer (Express)                   │
│  Node.js / tsx · Express 4.21 · Vite Dev Middleware         │
│  - POST /api/ai/generate-plan (Structured JSON Schema)      │
│  - POST /api/ai/chat (Context-Aware Assistant & Proposals)  │
│  - GET  /api/health (Server & Secrets Status Check)         │
│  - Server-Side Secrets Guardrail (No Key in Browser)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ User-Agent: aistudio-build
┌──────────────────────────────▼──────────────────────────────┐
│                     Google Gemini API                       │
│  @google/genai SDK · Model: gemini-3.8-flash                │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19 SPA running on Vite with Tailwind CSS v4, DM Sans for high-density reading, Plus Jakarta Sans for editorial headlines, and JetBrains Mono for tabular numbers.
- **Backend**: Express server running on port 3000 mounting Vite's middleware during development (`"dev": "tsx server.ts"`).
- **AI Integration**: Official `@google/genai` TypeScript SDK initialized strictly on the server with user telemetry headers (`'User-Agent': 'aistudio-build'`). Never exposes `GEMINI_API_KEY` to browser bundles.
- **Persistence**: Local storage abstraction with schema versioning, strict JSON validation, sample event seeding, and full backup export/import.

---

## 3. Key Features

1. **Portfolio Dashboard**:
   - Aggregate metrics across all planned events: active event count, portfolio budget total, task progress percentage, and confirmed vendors.
   - Segmented filter controls by event type (Weddings, Birthdays, Community).
   - Pre-loaded fictional sample event (*Meera & Kabir's Heritage Garden Wedding in Jaipur*) with 8 categories, active expense ledgers, milestones, vendors, and AI recommendations.

2. **Validated Event Creation Wizard**:
   - 4-step accessible wizard validating positive guest counts, positive budgets, ISO date sequences, and conditional type fields.
   - Choose between **Personalized Gemini Plan** or **Standard Industry Baseline**.

3. **Deterministic Budget Planner**:
   - Zero-reliance on LLMs for financial mathematics. All totals, variances, and utilization percentages are calculated via deterministic JavaScript routines with floating-point precision rounding.
   - Dynamic category allocation editor with percentage balancing indicators.
   - Comprehensive expense ledger with category filtering, payment status tracking (Unpaid, Partial, Paid), and vendor linkage.
   - Automatic visual over-budget alerts when actual or planned expenses exceed the allocated budget.

4. **Timeline & Task Management**:
   - Real-time countdown clock in local timezone (avoiding UTC day-shift bugs).
   - Priority categorization (Urgent, High, Medium, Low) and status tracking.
   - Task dependency checking: displays visual alerts if an item has incomplete prerequisite tasks.
   - Overdue deadline tracking and 7-day upcoming alerts.

5. **Vendor Management**:
   - Vendor directory tracking categories, contact persons, phone numbers, and emails.
   - Quote tracking, deposit ledger, and automatic remaining balance computation.
   - Clear distinction between user-verified vendors and AI-generated vendor criteria suggestions.

6. **Interactive AI Planning Assistant & Human-in-the-Loop Proposals**:
   - Integrated chat assistant aware of the active event's budget metrics, task completion rate, and confirmed vendors.
   - When recommending adjustments (e.g., budget cuts, adding weather contingency tasks, rescheduling), Gemini returns structured proposals.
   - **Review & Apply Modal**: Proposed changes are previewed in detail and require explicit user approval before modifying saved data.

7. **Executive Event Brief & Print Export**:
   - Formatted master document including executive overview, category expenditure tables, top action items, vendor contacts, and contingency protocols.
   - Responsive `@media print` CSS styling for crisp physical printing or PDF downloads.

8. **Data Portability & Resilience**:
   - Export full event state as formatted JSON backup.
   - Restore backups with schema validation preventing corrupted payloads.
   - Reset state or re-seed fictional sample event anytime.

---

## 4. AI Usage and Decision-Making Logic

- **Model Choice**: `gemini-3.8-flash` via `@google/genai`.
- **Structured Outputs**: Server configures `responseMimeType: "application/json"` and `responseSchema` with the official `Type` enum (`Type.OBJECT`, `Type.ARRAY`, `Type.STRING`, `Type.NUMBER`), ensuring deterministic schema compliance.
- **Context Construction**: Client submits active event summary (budget caps, actual spent, pending tasks, vendor counts) rather than raw noisy state.
- **Security Boundaries**: System instructions explicitly instruct the model to ignore prompt-injection attempts in user input and never leak secrets or system prompts.
- **Validation Before Storage**: Server parses and validates JSON structure before returning to client.

---

## 5. Project Structure

```
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
├── index.html                # HTML entry point with fonts and metadata
├── metadata.json             # AI Studio applet metadata & capabilities
├── package.json              # Project scripts and dependencies
├── server.ts                 # Full-stack Express server with Gemini routes
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── App.tsx               # Root application component
│   ├── main.tsx              # React DOM entry point
│   ├── index.css             # Tailwind v4 styles, typography & print media
│   ├── assets/
│   │   └── images/           # Generated visual assets (hero, avatar, event types)
│   ├── components/
│   │   ├── AiAssistant.tsx   # Planning assistant & proposal confirmation modal
│   │   ├── BudgetPlanner.tsx # Budget allocations, variance & expense ledger
│   │   ├── CreateEventWizard.tsx # Multi-step event creation wizard
│   │   ├── Dashboard.tsx     # Portfolio dashboard & event cards
│   │   ├── EventBriefExport.tsx # Publication-ready event brief & print view
│   │   ├── EventOverview.tsx # Active event metrics & Gemini plan summary
│   │   ├── Navbar.tsx        # Top Bar Contract navigation & event switcher
│   │   ├── SettingsDataModal.tsx # Data backup export/import & health monitor
│   │   ├── TimelineAndTasks.tsx  # Timeline countdown, tasks & dependencies
│   │   └── VendorManager.tsx # Vendor directory & contract balances
│   ├── constants/
│   │   ├── assets.ts         # Visual asset paths
│   │   └── initialData.ts    # Category templates & Jaipur wedding sample
│   ├── services/
│   │   ├── aiClient.ts       # Client API caller with abort controller
│   │   └── storage.ts        # Storage service with schema validation & backup
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces & domain models
│   └── utils/
│       ├── calculations.ts   # Deterministic financial & progress arithmetic
│       └── validation.ts     # Input validation & backup schema checker
└── tests/
    ├── ai-integration.test.ts # AI client, mock responses & error safeguards
    ├── calculations.test.ts   # Financial arithmetic & date countdown tests
    ├── storage.test.ts        # Persistence, proposal application & import tests
    └── validation.test.ts     # Event, expense, vendor & backup validation tests
```

---

## 6. Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for server-side AI planning calls | Yes (for AI features) | Injected via AI Studio Secrets |
| `PORT` | HTTP port for the full-stack server | No | `3000` |
| `APP_URL` | Application URL for self-referential links | No | Provided in AI Studio runtime |

---

## 7. Local Setup & Available Commands

### Prerequisites
- Node.js 20+
- npm (or bun)

### Installation
```bash
npm install
```

### Development
Starts the full-stack Express server with Vite middleware on `http://localhost:3000`:
```bash
npm run dev
```

### Run Automated Tests
Executes the comprehensive Vitest suite (26 tests covering arithmetic, validation, storage, and AI mocks):
```bash
npm test
```

### Type Checking & Linting
Validates TypeScript syntax without emitting files:
```bash
npm run lint
```

### Production Build
Builds the client SPA bundle into `/dist`:
```bash
npm run build
```

### Production Start
Starts the server serving the production build:
```bash
npm start
```

---

## 8. Security Considerations

- **Server-Side API Key**: `GEMINI_API_KEY` is accessed only within `server.ts` through Node's `process.env`. It is never bundled into frontend assets or exposed via API responses.
- **Input Sanitization**: Request bodies are parsed with explicit size limits (`limit: '2mb'`). Event names, locations, and descriptions are trimmed and length-bounded.
- **No Eval or Code Execution**: Structured JSON parsing is strictly enforced with native `JSON.parse`. AI output is never passed to `eval()` or dynamically compiled.
- **Data Protection**: Local storage persistence does not store credentials, session tokens, or API keys. Backups export only public event planning data.

---

## 9. Assumptions & Limitations

- **Single-User Scope**: Designed as a responsive single-user application. Multi-user real-time collaborative editing or team role-based access control is not enabled.
- **Vendor Booking Execution**: Vendor suggestions provided by Gemini are advisory selection criteria; the application does not automatically execute financial transactions or external vendor contract signings.
- **Local Persistence Fallback**: Uses browser local storage with JSON backup export/import as the persistent store. Cross-device syncing requires exporting and importing the backup JSON file.
