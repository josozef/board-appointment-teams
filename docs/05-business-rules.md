# 05 — Business Rules & Edge Cases

This document captures the **invariants** any implementation of the director
appointment workflow must enforce, regardless of channel. They cover
jurisdictional logic, validation, and behavioral edge cases. The state
model in `04-workflow-engine.md` and the step walkthrough in
`03-user-journey.md` are the authoritative companions; this document
collects the rules into one place.

---

## 1. Jurisdiction Rules

The destination entity's `jurisdiction` (e.g. `SG`, `US-DE`, `IE`, `NL`)
selects the rule set. Rules MUST flow from data, not from channel — a chat
agent files Form 45 the same way a UI does.

### 1.1 Singapore (`jurisdiction: SG`, e.g. entity `c5`)

| Aspect                     | Value                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| Regulator                  | ACRA (Accounting and Corporate Regulatory Authority)                  |
| Filing portal              | BizFile+                                                              |
| Consent form               | **Form 45 — Consent to Act as Director** (s.145(5), Companies Act, Cap. 50) |
| Notification form          | **Form 45 — Notification of Change of Director** (s.173(6), Companies Act) |
| Filing window              | **14 calendar days** from the date of appointment                     |
| Required identifier        | **NRIC** (or Passport No. for non-residents) — required on every form |
| Residency rule             | At least one director MUST be **ordinarily resident in Singapore**    |
| Minimum age                | 18                                                                    |
| Disqualification screen    | Must not be disqualified under the Companies Act                      |
| Statutory authority cited  | Article 104 of the Constitution + s.184A Companies Act (written board resolution) |
| Filename convention        | `Form_45_{CompanyShort}.pdf`, `Board_Resolution_{CompanyShort}.pdf`, `Consent_to_Act_{AppointeeShort}.pdf` |

### 1.2 USA (`jurisdiction: US-{state}`, e.g. Delaware, Texas, Michigan)

| Aspect                     | Value                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| Regulator                  | State Secretary of State / Division of Corporations                  |
| Filing portal              | State-specific (Delaware Division of Corporations, etc.)              |
| Consent form               | Generic "Consent to Act as Director" (state may not require filing)   |
| Notification form          | Generic "Regulatory Filing Form" (varies by state and entity type)    |
| Filing window              | Varies by state                                                       |
| Required identifier        | SSN/TIN (per state requirement) — collected only when required        |
| Residency rule             | Generally none for board members of LLCs/Corporations                 |
| Filename convention        | `Regulatory_Filing_{CompanyShort}.pdf`                                |

### 1.3 Ireland (`jurisdiction: IE`)

| Aspect                     | Value                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| Regulator                  | Companies Registration Office (CRO)                                   |
| Filing portal              | CORE (CRO online)                                                     |
| Forms                      | B10 — Notification of Change of Director / Secretary                  |
| Required identifier        | PPSN (Personal Public Service Number)                                 |

### 1.4 Netherlands (`jurisdiction: NL`)

| Aspect                     | Value                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| Regulator                  | Kamer van Koophandel (KvK)                                            |
| Filing portal              | KvK online                                                            |
| Forms                      | Form 11 — Wijziging functionaris                                      |
| Required identifier        | BSN                                                                   |

### 1.5 How Jurisdiction Is Determined

The entity's `jurisdiction` field (preferred) or `country` field is the
authoritative source. The agent MUST consult this field — never the human's
channel — to choose forms, regulator names, deadlines, and identifier
requirements. Adding a new jurisdiction is a data + rule-set change, not a
UI change.

---

## 2. Approver Rules

### 2.1 Default approver source

- The agent SHOULD pre-select approvers from the **Nomination Committee**
  for director appointments. Other workflows (e.g. CFO appointment) might
  default to a different committee — that's a separate workflow.
- The pre-selection MAY be informed by prior appointment policy at the same
  entity.

### 2.2 Member availability

- Members may be **disabled** with a human-readable reason (e.g. "Missing a
  saved signature template").
- Disabled members:
  - MUST NOT be selectable.
  - MUST be displayed (not hidden) so the human understands why they're
    unavailable.
  - MUST show the reason verbatim.
- The current default disabled member is **James Davidson** on the Nomination
  and Governance committees.

### 2.3 Minimum and maximum approvers

- At least **one** enabled member MUST be selected to confirm the approver
  list.
- There is no maximum. All enabled members MAY be selected.
- A member MAY be removed from the pre-selected set without affecting the
  ability to confirm — provided at least one remains.

### 2.4 Cross-committee selection

- The same person MAY appear on multiple committees (e.g. David Martinez
  is on Nomination, Audit, and Compensation).
- The human MAY add members from any committee, not just the default one.
- The resulting approver list is a list of **board members**, not committee
  representatives. Each appears once.

### 2.5 Vote behavior (prototype)

- All votes resolve as `Approved`. No reject or abstain path.
- Votes arrive sequentially; the prototype's simulation timing is in
  `04-workflow-engine.md`.
- Vote order is randomized via the timestamp pool.

### 2.6 Vote behavior (production)

- A vote of `Rejected` MUST halt auto-progression and notify the human with
  the rejecter's name and any provided rationale.
- A vote of `Abstained` does not advance the count. If a quorum cannot be
  reached, the agent MUST surface this to the human.
- The agent SHOULD send reminders to approvers whose vote has been pending
  past a configurable SLA.

### 2.7 Idempotency of confirmation

- After "Confirm approvers" is clicked, the approver list MUST be locked.
  Adding/removing approvers afterwards is not allowed without an explicit
  unlock action (which itself is an audit-loggable event).

---

## 3. Document Rules

### 3.1 Generation timing

- The **Consent to Act** is drafted as soon as the appointee is selected
  (entry to Step 2) and re-drafted whenever the appointee, NRIC, or
  effective date changes.
- The **Board Resolution** is drafted when the approver list is confirmed
  (Step 3a → 3b) so signature blocks render in confirmed order.
- The **Notification of Change of Director** is generated at the start of
  filing (Step 5).

### 3.2 Editability

- Both the Consent and the Resolution are inline-editable until they are
  sent for signature.
- After "Send for signature" / "Approve & send", the document MUST become
  read-only on its source surface. Subsequent edits would invalidate the
  signed copy.
- Document drafts and signed copies MUST both be retained. The signed copy
  is the one displayed in completion summaries; the draft is part of the
  audit trail.

### 3.3 Replace-with-my-document

- The Consent document supports an "upload your own" escape hatch, accepting
  PDF, DOC, DOCX, TXT, HTML.
- Text formats (TXT, HTML) MUST be loaded into the editor, replacing the
  draft content but preserving prior versions.
- Binary formats (PDF, DOC, DOCX) MUST be attached as the canonical
  document with an editor-side note indicating that the original Form 45
  template is still shown for reference. Binary content cannot be previewed
  in the editor.
- The Board Resolution does **not** support upload-replace by default —
  it must be drafted from structured data so signature blocks line up. An
  implementation MAY add upload-replace as an explicit override governed by
  a policy flag.

### 3.4 Filing always uses signed artifacts

- Step 5 MUST use the **signed** Board Resolution and the **executed**
  Consent to Act. Drafts MUST NOT be filed.
- If, for any reason, signing has not completed (e.g. an approver fails to
  sign), Step 5 MUST NOT auto-start.

---

## 4. Replacement vs. New Appointment

| Aspect                       | New Appointment              | Replacement                                                        |
|------------------------------|------------------------------|--------------------------------------------------------------------|
| `isReplacement`              | `false`                      | `true`                                                             |
| `departingDirector`          | `null`                       | `{ id, name, title }` of the departing director                    |
| Trigger source               | `human-request` or `workday.new-seat` | `workday.resignation`                                       |
| Step 1 framing               | "Identify a director for the new seat" | "Identify a replacement for {departing director}"        |
| Resolution Section 1         | Omitted                      | Cessation of Director (records resignation with effective date)    |
| Step 6 substeps              | 1: Record appointment        | 2: Record resignation + Record appointment                         |
| Workflow timeline narrative  | "new appointment"            | "director change"                                                  |

The replacement path is the **primary worked example** in this prototype. New
appointments are a strict subset (everything except the cessation/resignation
substeps).

---

## 5. Effective Date

- Default for replacement: agent SHOULD suggest the **day after** the
  departing director's last working day.
- Default for new seat: agent SHOULD suggest the next business day from
  workflow creation.
- The human MAY override the suggestion.
- If the human declines to provide an effective date in Step 2a, the value
  is stored as `"TBC"` and documents render `[date to be confirmed]` in the
  effective-date placeholders. The human MUST supply the date before the
  Board Resolution is sent (Step 3b checkpoint).
- Stored as ISO date `YYYY-MM-DD`. Displayed in human-friendly form
  appropriate to jurisdiction (e.g. `20 April 2026` for Singapore).
- No validation that the date is past or future. The agent SHOULD warn if
  the effective date is more than 30 days in the future.

---

## 6. Compliance Windows

| Jurisdiction | Window                                                  | Source                                  |
|--------------|---------------------------------------------------------|------------------------------------------|
| Singapore    | 14 calendar days from appointment to file with ACRA     | s.173(6), Companies Act, Cap. 50         |
| Ireland      | 14 days from change to file Form B10 with the CRO       | s.149, Companies Act 2014                |
| Netherlands  | 7 days from change to update KvK                        | Handelsregisterwet                       |
| US Delaware  | Not applicable for director changes (filed at next annual report) | Delaware General Corporation Law |

The agent MUST track the deadline computed at Step 0 (`trigger.filingDeadline`).

If the workflow has not reached `filing` by `filingDeadline - 3 days`, the
agent SHOULD escalate to the human (chat message, UI banner, email,
whichever channels are available).

---

## 7. NRIC and Identifier Validation

- NRIC (Singapore): canonical format is `[STFG]\d{7}[A-Z]`. The prototype
  does not validate the checksum digit, but production MUST.
- The identifier is required at Step 2a for the regulator-facing forms. The
  human supplies it; it MUST be displayed masked in the UI (with show/hide)
  and stored encrypted at rest.
- An empty submission MUST surface a field error and prevent the Step 2a
  checkpoint from being satisfied.

---

## 8. Workflow State Rules

### 8.1 Linearity and "disable-after-commit"

The workflow is linear: each step's controls become read-only once that
step's checkpoint has been crossed. Specifically:

- After **Save appointee data** (Step 2a): NRIC and effective date are
  read-only.
- After **Send for signature** (Step 2b): consent document is read-only on
  its source surface.
- After **Confirm approvers** (Step 3a): approver list is locked.
- After **Approve & send for signature** (Step 3b): resolution is locked.
- After Step 4 begins: all preceding controls are read-only globally — the
  surface presents the in-progress agentic state.

This linearity MUST be preserved in any channel. In chat, the agent MUST
refuse to re-edit a sent document and instead offer a "withdraw and start a
new draft" path that is itself an explicit, audit-logged action.

### 8.2 Idempotency

- A confirmation event received twice (e.g. the human double-taps
  "Send for signature") MUST result in a single send.
- Vote events from the signature service that arrive twice for the same
  approver MUST be deduplicated by `approverId + documentId`.
- Filing submissions MUST be idempotent on `(workflowId, documentSet)` —
  the regulator's `ackNumber` is the deduplication key.

### 8.3 Completion

A workflow is complete when all six step `status === 'completed'`. At
completion:

- `agentic.processComplete = true`.
- `status = 'complete'`.
- A completion summary is emitted to the channel(s) the human is using.
- The workflow is archived (kept queryable as part of the audit trail) and
  no longer counts toward "in-progress workflows" in any command-center
  view.

---

## 9. Default Values & Fallbacks

| Field                         | Default                                                        |
|-------------------------------|----------------------------------------------------------------|
| `effectiveDate`               | Day after `lastWorkingDay` (replacement) or next business day  |
| `appointmentEffectiveDate` if absent | `"TBC"` (rendered as "[date to be confirmed]" in docs)  |
| `approvers.selected`          | All enabled members of the Nomination Committee                |
| `selectedCommittee`           | `Nomination Committee`                                         |
| `isReplacement`               | Inferred from trigger; `false` for `human-request` unless specified |
| `consent.replacedByUpload`    | `null`                                                         |
| `agentic.active`              | `false` until Step 3 checkpoints both clear                    |

---

## 10. Channel-Specific Rules

These guardrails apply when the workflow is rendered into a particular
channel.

### 10.1 UI

- All checkpoint actions MUST be unambiguous, named buttons. No "next" /
  "continue" buttons that ambiguously trigger multiple side effects.
- Status panel MUST be visible alongside the work area at all times so the
  human always knows what step they are on, what is in progress, and what
  is up next.

### 10.2 Chat

- The agent MUST require explicit affirmation for every checkpoint
  ("Approve & send the resolution? (yes / no)"), not just implication
  ("Looks good to me").
- Long-running phases MUST emit at least one status message per substep
  (or every N minutes for human-perception) so the thread remains visibly
  alive.
- Document attachments MUST link to a viewer that allows full-fidelity
  review; the chat MUST NOT render documents as plain text where edits
  would silently lose formatting.

### 10.3 Deterministic backend

- The state machine MUST persist after every transition. A crash MUST NOT
  lose work — the workflow MUST resume from the last persisted state on
  restart.
- All checkpoints MUST be modeled as `awaiting:*` states with explicit
  resume events. There is no "implicit progress" — every advance is an
  event with an actor and a timestamp.
- The integration contracts in `04-workflow-engine.md` are canonical.
  Implementations MAY mock them but MUST preserve their shape so chat /
  UI / backend implementations are interchangeable.

### 10.4 Email / portal (approver side)

- Each emailed action MUST encode `(workflowId, stepId, approverId,
  documentId)` so the response can be correlated back to the right
  workflow even if the approver replies days later.
- Approver actions reaching the system from email MUST follow the same
  voting state-machine path as UI actions — there is no separate
  "email-only" code path.

---

## 11. Edge Cases & Error Handling

| Situation                                                       | Required behavior                                                        |
|------------------------------------------------------------------|--------------------------------------------------------------------------|
| Workday returns no candidates matching eligibility               | Step 1 surfaces an empty shortlist + an "Add candidate manually" path.   |
| Recommended candidate is the departing director themselves       | Filter them out; the agent MUST NOT recommend the resigning person.      |
| Effective date is before today                                   | Permit, but warn the human (governance issue, not a hard error).         |
| Effective date is more than 30 days out                          | Warn the human and confirm.                                              |
| All approvers disabled                                           | Refuse to advance Step 3a; surface the disablement reasons.              |
| An approver rejects the resolution (production)                  | Halt auto-progress; notify human; require explicit decision.             |
| Filing rejected by regulator                                     | State → `filing-failed`; capture the regulator's messages; notify human; allow retry after correction. |
| 14-day filing window approaches with no signed resolution        | Escalate to the human at deadline minus 3 days.                          |
| Human cancels after filing has succeeded                         | Refuse cancellation; the regulator already has the filing. Offer to start a corrective workflow. |
| Workday-sourced field is missing for a required regulator field  | Treat as a Step 2a gap; ask the human to supply explicitly.              |
| Same person re-triggered (duplicate resignation event)           | Deduplicate by `(employeeId, lastWorkingDay)`. Do not start a second workflow for the same trigger. |

---

## 12. Required Audit Trail (Summary)

Every implementation MUST persist:

1. The trigger event (raw payload + framing message).
2. Each human checkpoint event with actor, timestamp, before/after state.
3. Each integration call (operation, payload, response, timestamps).
4. Document versions (drafts, signed copies, uploaded replacements).
5. Vote events with approver id, vote, timestamp, and source (UI / email /
   portal).
6. Filing receipts with regulator ack numbers.
7. Final completion summary.

The audit trail MUST be queryable by `workflowId` and MUST be exportable as
a single document (PDF or JSON) for compliance review. The CoSec relies on
this trail to evidence that fiduciary duties and statutory requirements were
discharged — losing it is a governance failure, not just a technical one.
