# Security Specification: Sunshine Classes ERP (Security Spec)

This document contains the Data Invariants, "Dirty Dozen" payloads, and conceptual test runner specification for the Cloud Firestore Security rules of the Sunshine Classes ERP system.

---

## 1. Data Invariants (Relational & Integrity Controls)

1. **Role Access Bounds (RBAC)**:
   - System access levels are strictly partitioned: `SUPER_ADMIN`, `ADMIN`, `RECEPTIONIST`, `TEACHER`, `STUDENT`.
   - Identity spoofing is strictly prohibited: A user may never modify their own role or set privileged fields like `role` during registration.
   - Admin roles are mapped only via secure lookup on `/databases/$(database)/documents/admins/$(request.auth.uid)`.

2. **Student Entity Invariants**:
   - Every student document must have a valid non-empty `rollNo` matching the format `^SC2026-\d{6}$`.
   - Every student document must map to a valid authenticated user via `userId`.
   - `preferredBatch` must be a string containing a valid batch name. `batchId` is forbidden.

3. **Financial (Fee Status) Invariants**:
   - Every `FeeStatus` record must contain a valid `studentId`, `month` (formatted like `July 2026`), `totalFee`, `pendingFee`, `status` (`PENDING`, `PARTIAL`, `PAID`), and `dueDate` (formatted as `YYYY-MM-DD`).
   - Standard fees must align with predefined class standards (Class 10: ₹1200, Class 9: ₹1000, others: ₹700).

4. **PII Protection & Isolation**:
   - Students' personal records (email, phone, parentMobile, address) constitute Personally Identifiable Information (PII).
   - Read access to these documents is restricted to administrators and the specific student owner (`request.auth.uid == resource.data.userId`). Blanket guest reads are forbidden.

5. **Terminal State Locking**:
   - Audit logs (`audit_logs`) and receipt records are immutable and cannot be deleted or modified once written.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent malicious attempts to bypass identity boundaries, hijack roles, poison fields, or trigger denial-of-wallet attacks:

### Payload 1: Role Escalation Attack (Identity Spoofing)
* **Goal**: Guest registers a new user profile setting their own role to `ADMIN` to bypass dashboard restrictions.
* **Payload (`users/attacker-uid`)**:
  ```json
  {
    "username": "hacker1337",
    "name": "Hacker",
    "email": "hacker@gmail.com",
    "role": "ADMIN",
    "active": true
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 2: Ghost Field Poisoning (Shadow Update)
* **Goal**: Student attempts to change their profile but injects a hidden `isVerified` flag to unlock extra permissions.
* **Payload (`students/student-uid`)**:
  ```json
  {
    "rollNo": "SC2026-000001",
    "name": "Aarav Sharma",
    "class": "Class 10",
    "mobile": "9876543210",
    "fatherName": "Rajesh Sharma",
    "isVerified": true
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 3: Resource Poisoning (Denial of Wallet)
* **Goal**: Injects an ultra-long, 1MB junk string into a free-form string field to exhaust Firestore storage.
* **Payload (`students/student-uid`)**:
  ```json
  {
    "rollNo": "SC2026-000001",
    "name": "Aarav Sharma",
    "class": "Class 10",
    "mobile": "9876543210",
    "fatherName": "Rajesh Sharma",
    "address": "[1,000,000 character junk string...]"
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 4: Arbitrary ID Injection (ID Poisoning)
* **Goal**: Student registers a document with an extremely large ID string or invalid characters to pollute index boundaries.
* **Target Path**: `students/INVALID_ID_$$$_CRASH`
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 5: Anonymous Fee Evasion (Price Manipulation)
* **Goal**: Student updates their pending fee status to `PAID` without submitting any payment.
* **Payload (`studentFees/fee-abc`)**:
  ```json
  {
    "studentId": "s-std-001",
    "month": "June 2026",
    "totalFee": 1200,
    "pendingFee": 0,
    "status": "PAID",
    "dueDate": "2026-06-10"
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 6: Untrusted Timestamp Spoofing
* **Goal**: Attacker provides an outdated client timestamp to manipulate records history.
* **Payload (`students/student-uid`)**:
  ```json
  {
    "rollNo": "SC2026-000001",
    "name": "Aarav Sharma",
    "class": "Class 10",
    "mobile": "9876543210",
    "fatherName": "Rajesh Sharma",
    "createdAt": "2010-01-01T00:00:00Z"
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 7: Unauthorized Audit Log Erasure
* **Goal**: Malicious staff member attempts to delete telemetry audit logs to hide their activities.
* **Operation**: `DELETE` on `sunshine_erp_state/audit_logs`
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 8: PII Leak Query (Unconstrained Blanket Read)
* **Goal**: Unauthenticated user tries to scrape all student private contact cards using list queries.
* **Operation**: `LIST` on `/students` without filter constraints.
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 9: Self-Appointed Faculty Admission
* **Goal**: Attacker tries to create a teacher profile to access teacher-only rosters.
* **Payload (`teachers/teacher-1`)**:
  ```json
  {
    "name": "Fraud Faculty",
    "email": "fraud@sunshineclasses.net",
    "phone": "9999999999"
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 10: State Shortcut (Direct Admission Approval)
* **Goal**: Lead attempts to directly write an `APPROVED` admission record, bypass review, and gain tuition access.
* **Payload (`admissions/lead-001`)**:
  ```json
  {
    "id": "lead-001",
    "studentName": "Attacker",
    "className": "Class 10",
    "status": "APPROVED"
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 11: Non-Owner Fee Modification
* **Goal**: A student attempts to read or modify another student's fee statuses.
* **Operation**: `UPDATE` on `studentFees/other-student-fee`
* **Expected Verdict**: `PERMISSION_DENIED`

### Payload 12: Orphaned Payment Creation
* **Goal**: Attacker creates a standalone payment record without referencing a valid student profile.
* **Payload (`payments/pay-001`)**:
  ```json
  {
    "studentId": "NON_EXISTENT_ID",
    "amountPaid": 1200,
    "paymentMethod": "CASH",
    "paymentDate": "2026-06-18"
  }
  ```
* **Expected Verdict**: `PERMISSION_DENIED`

---

## 3. Test Runner Design

These test assertions are implemented inside `firestore.rules.test.ts` conceptual suite to verify absolute compliance:

```typescript
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

describe("Sunshine Classes ERP Security Rules Test Suite", () => {
  it("locks guest user profiles from writing their own roles", async () => {
    const db = getUnauthenticatedContext().firestore();
    await assertFails(db.collection("users").doc("attacker-uid").set({
      username: "hacker",
      name: "Attacker",
      email: "hacker@test.com",
      role: "ADMIN"
    }));
  });

  it("denies students from accessing other student fee bills", async () => {
    const db = getAuthenticatedContext({ uid: "student-123" }).firestore();
    await assertFails(db.collection("studentFees").doc("student-456-fee").get());
  });

  it("blocks modifications to terminal audit logs", async () => {
    const db = getAuthenticatedContext({ uid: "receptionist-1" }).firestore();
    await assertFails(db.collection("sunshine_erp_state").doc("audit_logs").delete());
  });
});
```
