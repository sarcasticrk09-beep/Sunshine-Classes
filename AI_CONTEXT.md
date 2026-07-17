# AI_CONTEXT.md — Permanent AI Memory & Context Rules

This file serves as permanent cognitive memory for all AI assistants (Google AI Studio, Claude Code, Cursor, ChatGPT, Gemini, Copilot) collaborating on the **Sunshine Classes ERP (Sunshine ERP)** codebase. Reading this document preserves architectural continuity and prevents context drift.

---

## 1. Project Identity
- **Project Name**: Sunshine Classes ERP (Sunshine ERP)
- **Purpose**: Unified administrative ecosystem and educational portal managing admissions, student life cycles, interactive fee ledgers, automated notification pipelines, and performance metrics.
- **Vision**: To maintain a modern, paperless, and automated system connecting students, parents, teachers, and founders with clean local and cloud synchronization.
- **Current Status**: Active, Production-Ready, and Fully Operational.

---

## 2. Pre-Flight AI Instructions

Before suggesting, writing, or executing any code changes, any AI assistant **MUST** read and follow these steps:

1. **Verify Context**: Consult `PROJECT.md` (architecture, core data), `FEATURES.md` (features list), `DATABASE.md` (schemas, collections), and `DEVELOPMENT.md` (guidelines, setup).
2. **Read Code First**: Always run `view_file` on target source code lines before applying surgical edits to avoid stale context or line numbers.
3. **Preserve Rules**: Under no circumstance should you bypass type safety limits or alter core business rules.
4. **Compile & Lint**: Execute `lint_applet` and `compile_applet` before concluding a turn to verify zero compilation errors.

---

## 3. Core Development Principles

- **Single-Page Views**: Simple queries and lightweight page templates must remain in elegant single-view structures without complex nested tabs.
- **Modularity**: Split large components out of main orchestrators (`App.tsx`) into dedicated component modules.
- **Aesthetic Pairings**: Employ standard, highly scannable layouts with generous negative space. Avoid low-quality visual clutter like CLI dashboards or "online" telemetry lines in margins.
- **Deterministic IDs**: Every newly created interactive element, input field, or trigger button **MUST** be initialized with an explicit, unique, and lowercase `id` attribute.

---

## 4. Architecture Rules

The following core structures **MUST NOT** be modified unless explicitly requested:
- **Unified Express-Vite Server**: Keep `server.ts` configured as a single host using Vite middleware in development and static bundle serving in production.
- **Dual Database Sync**: Maintain synchronous updates to Firestore and client `localStorage` cache states.
- **Cryptographic Passwords**: Secure all credentials on both client and server utilizing `simpleSecureHash` with `sha256_` prefixes.

---

## 5. Non-Negotiable Database Schemas (Types)

When manipulating database entities, you must adhere to `/src/types.ts`:

- **Students**: Use `student.preferredBatch` (type string) for the student's batch name. **DO NOT** use `student.batchId`. Identifiers are tracked via `rollNo` or `id`.
- **Teachers**: Use `teacher.specialty` (type `string[]`) to list teaching subjects. **DO NOT** use `teacher.subject` as a direct string.
- **Fee statuses**: Structured as objects containing `month` (e.g. `'June 2026'`, `'July 2026'`), `totalFee`, `paidFee`, `pendingFee`, `status` (`'PAID'` | `'PENDING'` | `'PARTIAL'`), and `dueDate` (string formatted `'YYYY-MM-DD'`).

---

## 6. Documentation Rules

Whenever a change is introduced, update the respective documentation in the same turn:
- **Architectural Shift**: Update `PROJECT.md`
- **Feature Lifecycle**: Update `FEATURES.md`
- **Data Schemas / Rules**: Update `DATABASE.md`
- **Development Workflows**: Update `DEVELOPMENT.md`

---

## 7. Current Work Checklist

- [x] **Admissions camera button integration**: Successfully added high-resolution webcam capture module for students.
- [x] **Consolidated schemas & credentials policies**: Auto-generates unique usernames, defaults passwords, and triggers instant popup alerts for administrative ease.
- [x] **Fully compiled single-port servers**: Fully bundled `dist/server.cjs` Express server builds with esbuild.

---

## 8. AI Checklist Before Concluding Work

- [ ] Did I run `lint_applet` and `compile_applet` to guarantee compile safety?
- [ ] Did I verify that my modifications did not break existing system roles or workflows?
- [ ] Are all new buttons, inputs, or interactive modal elements initialized with explicit, unique `id` attributes?
- [ ] Did I synchronize documentation files to reflect my code changes?
