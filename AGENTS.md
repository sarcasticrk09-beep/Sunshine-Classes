# Coding and Communication Instructions for Sunshine ERP

## 1. Codebase Context & Typings Guidelines
This repository is a full-stack Sunshine Classes ERP administrative system. To prevent compilation errors, any AI assistant working on this codebase must adhere strictly to these type definitions from `/src/types.ts`:

- **Student Object Properties**:
  - Use `student.preferredBatch` (type string) for the student's batch name.
  - Do **NOT** use `student.batchId`.
  - Use `student.rollNo` or `student.id` for student identification.

- **Teacher Object Properties**:
  - Use `teacher.specialty` (type string[]) for the teacher's subject list or specializations.
  - Do **NOT** use `teacher.subject` as a direct string.
  - Use `teacher.qualification` (type string) and `teacher.name` (type string).

- **FeeStatus Object Properties**:
  - Contains billing cycle info: `fee.month` (e.g., 'June 2026', 'July 2026'), `fee.totalFee`, `fee.paidFee`, `fee.pendingFee`, `fee.status` ('PAID' | 'PENDING' | 'PARTIAL'), and `fee.dueDate` (string formatted 'YYYY-MM-DD').

---

## 2. strict AI Quality and Conciseness Directives
To optimize communication efficiency and maintain elite professional standard:

- **Answer Quality**:
  - Prioritize working, fully compiled code over explanations.
  - Always run `lint_applet` and `compile_applet` before finishing your turn to ensure zero TypeScript errors.
- **Answer Conciseness**:
  - Keep final summaries to **1-2 short, highly scannable paragraphs** or **2-3 direct, elegant bullet points**.
  - Avoid listing internal file paths (such as `/src/components/AdminDashboard.tsx`) or raw component file names unless explicitly asked.
  - Avoid any clinical developer jargon or self-praising fluff (do NOT call your own work "stellar", "gorgeous", or "flawless"). Use humble, descriptive, human-readable prose.
- **Code Structuring**:
  - Keep code modular. Do not bloat individual layout files with unrelated logic.
  - Ensure all newly created buttons, inputs, or interactive modal layouts have explicit, unique `id` attributes.
