# 03 — Workflow Steps (Channel-Agnostic Walkthrough)

This document describes the **logical steps** of the director appointment
workflow. It is interface-agnostic — it describes *what* happens at each step,
*who* is responsible, and *what artifacts* flow through, **not** how it is
rendered.

The workflow is six numbered steps. Each step has an explicit **agent
responsibility**, **human responsibility**, and **system responsibility**,
plus the inputs/outputs and channel guidance for UI / chat / deterministic
implementations.

---

## Workflow Overview

```
Step 0 — Trigger
   ↓
Step 1 — Identify replacement candidate          [agent ranks · human selects]
   ↓
Step 2 — Collect appointment data                [agent pre-fills · human supplies gaps · drafts consent]
   ↓
Step 3 — Configure approvers                     [agent suggests · human confirms · drafts resolution]
   ↓
Step 4 — Board approval                          [autonomous: collect votes]
   ↓
Step 5 — Regulatory filing                       [autonomous: file with regulator]
   ↓
Step 6 — Update entity records                   [autonomous: record resignation + appointment]
   ↓
Workflow complete
```

The workflow is **resumable** at every step. Implementations MUST persist
state between sessions and allow the human to leave and return without
repeating any prior input.

---

## Step 0 — Trigger (System-Initiated)

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | Detect that a director appointment is needed and frame the workflow.                           |
| **Initiator**     | System (Workday event) **or** human ("I need to appoint a new director on entity X").         |
| **Inputs**        | Resignation event (`employeeId`, `entityId`, `lastWorkingDay`) **or** human request.          |
| **Outputs**       | A new workflow instance with `entity`, `isReplacement`, `departingDirector`, `filingDeadline`.|

### Agent responsibilities

- Recognize the trigger event and construct the framing message:
  - **Source** of the trigger (Workday / human request / scheduled review).
  - **Departing director** (if replacement) and their last working day.
  - **Statutory deadline** computed from jurisdictional rules
    (e.g. ACRA s.173(6) → 14 days).
  - **Why this matters now** — a one-line urgency statement.
- Open the workflow in the **trigger framing** state and present the next
  step as "Identify replacement candidate" with an obvious affordance to start.

### Human responsibilities

- (Optional) Initiate manually if the system did not detect a trigger.
- Acknowledge the framing and proceed.

### Channel guidance

- **UI**: A trigger summary card on the workflow overview ("Workday has
  reported that Wei 'David' Chen has submitted his resignation… last working
  day April 17, 2026 — 14 days from now"). The status panel shows Step 1 as
  in-progress.
- **Chat**: The agent's opening turn states the trigger and ends with a
  question ("Want me to walk you through the candidate shortlist?").
- **Deterministic workflow**: Inbound event → create run → emit
  `state: identifying-candidate`.

---

## Step 1 — Identify Replacement Candidate

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | Produce a ranked shortlist and have the human pick the appointee.                              |
| **Inputs**        | Entity, `isReplacement`, jurisdictional eligibility ruleset.                                  |
| **Outputs**       | `selectedCandidate` (one of the shortlist) → unlocks Step 2.                                 |

### Agent responsibilities

- Query Workday for employees associated with the destination entity who
  hold eligible titles and meet minimum tenure requirements.
- Screen each candidate against the entity's **jurisdictional director
  eligibility rules** (e.g. for Singapore: natural person, ≥ 18, not
  disqualified, residency for the entity's "ordinarily resident" director
  requirement).
- Score and rank candidates per the rubric in `02-mock-data.md`.
- Present the shortlist with explicit eligibility flags. Mark the top
  candidate `Recommended` only if it scores ≥ 90 with no warnings.
- Surface warnings prominently for any candidate that fails a hard rule
  (e.g. non-resident in a residency-required jurisdiction). MUST NOT silently
  filter such candidates out — the human may still want to see them.

### Human responsibilities

- Review the shortlist and select one candidate.
- (Optional) Ask the agent for additional context on any candidate, request
  comparison, or request additional candidates.
- Confirm the selection. **This is a human checkpoint** — the agent does not
  auto-proceed.

### Outputs

```
selectedCandidate = {
  personId,
  name,
  title,
  employer,
}
```

### Substeps (for status-panel rendering)

1. Workday integration
2. Jurisdictional screening
3. Candidate shortlist

### Completion criteria

The human confirms exactly one candidate. The Step 1 status transitions
`in_progress → completed` and Step 2 transitions `not_started → in_progress`.

### Channel guidance

- **UI**: A "Workday integration" context card followed by 3 candidate cards
  with name, title, match score, eligibility chips, and a "Select candidate"
  / "Select" CTA. The selected card is highlighted and chipped `Selected`.
- **Chat**: The agent posts the shortlist as a structured message (markdown
  table or rich card per candidate). The human replies with the name or the
  rank; the agent confirms and moves on. If the human asks for more detail,
  the agent answers in-thread and re-presents the shortlist on request.
- **Deterministic workflow**: `state: awaiting-candidate-selection` with the
  shortlist as a payload. A `selectCandidate` event resumes execution.

---

## Step 2 — Collect Appointment Data

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | Gather the data the entity register and the regulator need, and prepare the consent document. |
| **Inputs**        | `selectedCandidate`, Workday particulars, jurisdictional document templates.                 |
| **Outputs**       | Saved appointee record + consent document sent for signature.                                |

This step has **two parallel sub-tasks** that are presented side by side.
Both must be completed before the step is marked done.

### Sub-task 2a — Appointee Details

#### Agent responsibilities

- Pre-fill every Workday-sourced field as **read-only context** (full name,
  title, email, phone, DOB, nationality, residential address, residency
  status). Mark each with a `From Workday` hint.
- Identify the regulator-required identifier that Workday does not hold
  (NRIC for Singapore; equivalent ID for other jurisdictions) and explicitly
  flag it as **action required**.
- Suggest an effective date (e.g. day after the departing director's last
  working day).

#### Human responsibilities

- Supply the missing identifier (NRIC).
- Confirm or override the effective date. (If absent, store as `"TBC"` and
  carry forward; documents will display "[date to be confirmed]".)
- Submit "Save appointee data". This is a human checkpoint.

#### Validation

- NRIC is required. Empty submission MUST surface a field error
  ("NRIC is required.").
- The effective date MAY be deferred to a later step if the human chooses.

#### Channel guidance

- **UI**: Tabbed view, Tab 1 "Appointee details". A 2-column grid of
  read-only Workday-sourced fields, followed by an action-required panel
  (warning-yellow background) containing the NRIC field with a `Required`
  chip and the effective date.
- **Chat**: The agent posts the pre-filled summary, then asks two questions:
  "What is {appointee}'s NRIC?" and "What effective date should we use?"
  (suggested default in parentheses).
- **Deterministic workflow**: `state: awaiting-appointee-data` with payload
  `{ workdaySummary, suggestedEffectiveDate, requiredFields: ['nric'] }`.
  Resumed by a `submitAppointeeData` event.

### Sub-task 2b — Consent to Act Document

#### Agent responsibilities

- Generate the jurisdictional consent document (Singapore: Form 45) populated
  from the Workday particulars + the human-supplied NRIC + effective date.
- Show a header explaining what the document is and how to act on it.
- Provide three actions on the editor:
  1. **Edit inline** — any field with a visible underline is editable; the
     agent's draft is just a starting point.
  2. **Replace with my document** — file upload accepting PDF, DOC, DOCX,
     TXT, HTML. Text formats load into the editor; binary formats are
     attached as the canonical document with a note.
  3. **Send to {appointee} for signature** — the explicit "leave the
     building" action.

#### Human responsibilities

- Review the draft. Edit if needed. Replace with their own document if
  preferred. Click **Send for signature** when satisfied. **Human checkpoint.**

#### Channel guidance

- **UI**: Tab 2 "Consent to act" hosts a full-bleed TipTap editor with a
  header explaining the document and a pinned footer with the two action
  buttons.
- **Chat**: The agent posts the draft as a rich attachment with three
  actions: "Open editor", "Replace with my own document", "Send to
  {appointee} for signature". Editing happens in a sub-thread or external
  editor; the chat thread receives the final-state confirmation.
- **Deterministic workflow**: `state: awaiting-consent-send`, payload
  `{ documentVersion, draftContent }`. Resumes on `sendConsentForSignature`.

### Step 2 substeps (for status-panel rendering)

1. Entities & appointment   ← Sub-task 2a
2. Consent to act document  ← Sub-task 2b

### Completion criteria

Both sub-tasks completed. Step 2 transitions `in_progress → completed` and
Step 3 transitions `not_started → in_progress`.

---

## Step 3 — Configure Approvers

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | Decide who must sign the resolution and prepare the resolution itself.                         |
| **Inputs**        | Selected candidate + appointment data, list of board committees and members, prior-appointment policy. |
| **Outputs**       | Confirmed approver list + Board Resolution sent for signature.                                |

This step also has **two sub-tasks**.

### Sub-task 3a — Select Approvers

#### Agent responsibilities

- Pre-select a default approver set from the **Nomination Committee** based on
  prior appointment policy. The default for the worked example is all
  enabled Nomination Committee members (4 of 5; James Davidson is disabled).
- Surface a "Selected approvers" list with the current set and an
  expand-to-browse "Add from committee" section that exposes all four
  committees.
- For disabled members, render the disabled state with the human-readable
  reason and prevent them from being added.

#### Human responsibilities

- Review the pre-selected set. Add or remove approvers as needed (drawing
  from any committee, not just Nomination).
- Click **Confirm {N} approvers**. Human checkpoint — locks the list.

#### Validation

- At least one enabled member must be selected.
- Disabled members MUST NOT be added.
- Members from different committees MAY coexist on the approver list (the
  resulting list is just a list of board members — they're not selected as
  representatives of a committee).

#### Channel guidance

- **UI**: Tab "Select approvers" with a "Selected approvers" panel + an
  expandable committee browser. Each committee row shows member count;
  expanded rows list members with `Add` / `Added` / `Unavailable` chips.
- **Chat**: The agent posts the suggested set with each member as a chip,
  asks "Approve this set, or want to change it?". Modifications happen
  conversationally ("remove Linda Williams", "add Thomas Chen from Audit").
- **Deterministic workflow**: `state: awaiting-approver-confirmation` with
  payload `{ suggestedApprovers, committees }`. Resumes on
  `confirmApprovers`.

### Sub-task 3b — Board Resolution

#### Agent responsibilities

- Generate the Board Resolution from all known data (entity, departing
  director, appointee, NRIC, address, effective date) plus the **confirmed
  approver list** so signature blocks render in order.
- Draft sections: Cessation, Appointment, Consent, Statutory Filings,
  General Authority, Schedule A — Particulars of New Director, signature
  blocks.
- Provide an inline-editable view + a single "Approve & send for signature"
  action.

#### Human responsibilities

- Review the resolution. Edit if needed. Click **Approve & send for
  signature**. Human checkpoint — sends the resolution to the board portal /
  email / signature service for each approver.

#### Channel guidance

- **UI**: Tab "Board resolution" hosts the full-bleed TipTap editor + pinned
  footer. After approval the action button changes to a disabled "Approved &
  sent to board" success state.
- **Chat**: The agent posts the draft as an attachment with "Open editor" /
  "Approve & send" actions; sub-thread for edits.
- **Deterministic workflow**: `state: awaiting-resolution-send` payload
  `{ resolutionContent, approvers }`. Resumes on `sendResolution`.

### Step 3 substeps

1. Select approvers
2. Board resolution

### Completion criteria

Both sub-tasks completed. Step 3 → completed, Step 4 → in_progress, and the
**autonomous phase begins**.

---

## Step 4 — Board Approval (Autonomous)

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | Collect electronic signatures from each approver and finalize the signed resolution.           |
| **Inputs**        | Sent resolution + approver list.                                                              |
| **Outputs**       | Signed resolution document, vote tally, per-approver timestamps.                              |

### Agent responsibilities

- Track each approver's vote independently. Approvers may respond in any
  order across hours or days.
- Update progress in real time. The user MUST be able to leave and return —
  state is persistent.
- When all approvers have voted, mark the resolution **signed** and notify
  the human ("All approvals received — resolution is signed").
- Make the signed resolution available for the next step.

### Human responsibilities

- **None required to advance the workflow.** The human MAY monitor progress.
- The human MAY pause/resume the simulation (prototype) or request a
  reminder be sent to a tardy approver (production).

### Vote behavior (prototype)

- All votes resolve as `Approved` (no reject/abstain path).
- Votes arrive sequentially with simulated timestamps shuffled from a fixed
  pool.
- Progress tally updates as `{approved}/{total} approvals received`.

### Production behavior (notes)

- Real implementations MUST handle reject / abstain paths and re-route or
  cancel the workflow on rejection per board policy.
- Real implementations SHOULD provide a "send reminder" affordance and audit
  who voted from where (IP / device / timestamp).

### Channel guidance

- **UI**: Step 4 surface shows a progress bar + voter rows. Each row
  displays the approver, status (`Awaiting` chip → `Approved` chip with
  timestamp), and a circular spinner for in-flight responses.
- **Chat**: The agent posts a single status message that updates as votes
  arrive (or a new message per vote). On completion, posts "Resolution
  signed — ready for filing."
- **Deterministic workflow**: `state: awaiting-board-approval` with a
  per-approver `votes` array. Each `voteCast` event updates the corresponding
  entry. When all entries are `approved`, transition to filing.

### Completion criteria

All approvers have status `approved`. Step 4 → completed, Step 5 →
in_progress automatically.

---

## Step 5 — Regulatory Filing (Autonomous)

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | File the signed resolution and statutory forms with the regulator.                            |
| **Inputs**        | Signed resolution + Form 45 (consent) + jurisdictional filing form.                          |
| **Outputs**       | Filing receipt / confirmation; documents marked filed.                                        |

### Agent responsibilities

- Run three substeps in order, each posting a real-time timestamp on
  completion:
  1. **Download signed documents** — fetch the signed Board Resolution and
     consent document.
  2. **e-File with ACRA** (or the equivalent regulator) — upload the
     Notification of Change of Director (Form 45) plus required attachments
     via the regulator's e-filing API or BizFile+.
  3. **Confirm filing** — receive and persist the regulator's
     acknowledgement.
- Display the documents that were filed:
  - Board Resolution (Signed)
  - Form 45 — Consent to Act as Director
  - Form 45 — Notification of Change of Director

### Human responsibilities

- **None required to advance the workflow.** The human MAY monitor
  progress.
- In production, the human MAY be required to approve the e-filing payload
  before submission (an additional "Confirm and file" checkpoint). For the
  prototype, this is automatic.

### Important shift from prior versions

Earlier prototypes treated filing as **manual** ("user must download and
file, then click Complete Workflow"). The current model is **autonomous** —
the agent files via integration. Implementations MAY restore a manual
checkpoint here per organizational policy, but they MUST NOT lose track of
the filing artifacts (receipt, timestamps).

### Channel guidance

- **UI**: Step 5 surface shows a progress card with the 3 substeps, each
  with a status icon and timestamp, plus a documents-filed list.
- **Chat**: A single threaded status message with substep ticks and a final
  "Filing complete — all documents submitted to ACRA" message.
- **Deterministic workflow**: `state: filing` with substeps as a sub-state
  machine. Failure on any substep moves to `state: filing-failed` and the
  human is notified.

### Completion criteria

All filing substeps `completed`. Step 5 → completed, Step 6 → in_progress.

---

## Step 6 — Update Entity Records (Autonomous)

| Aspect            | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| **Intent**        | Bring the entity's internal record into agreement with what was filed.                         |
| **Inputs**        | Filed Form 45, signed resolution, departing-director and appointee details.                   |
| **Outputs**       | Entity register updated; workflow complete.                                                   |

### Agent responsibilities

- Run substeps in order, posting real-time timestamps:
  1. **Record resignation — {departing director}** *(replacement only)*
  2. **Record appointment — {appointee}**
- For new-seat appointments (no departing director), only the second substep
  runs.
- On completion, post a workflow-complete summary:
  - Departing director's resignation has been recorded.
  - Appointee has been appointed.
  - All regulatory filings submitted.
  - Entity records updated.
  - Board resolution signed.

### Human responsibilities

- **None required to advance the workflow.**

### Channel guidance

- **UI**: Step 6 surface mirrors Step 5 — substep tracker + a final
  success card.
- **Chat**: A status message during execution and a single completion
  summary.
- **Deterministic workflow**: `state: updating-entities` with substeps; on
  success, transition to `state: complete`.

### Completion criteria

All entity substeps `completed`. Step 6 → completed. The workflow transitions
to `complete` and is archived.

---

## Cancellation, Pause, Resume

These behaviors apply across all steps unless explicitly noted.

| Action  | Allowed when                                | Effect                                                                 |
|---------|---------------------------------------------|------------------------------------------------------------------------|
| Cancel  | Any step before regulatory filing succeeds. | Workflow terminates; state set to `cancelled`. Drafts retained for audit. The human is notified. After Step 5 succeeds, cancellation has no effect — the regulator already has the filing. |
| Pause   | During autonomous segments (Step 4–6).      | Simulation/job halts. State preserved. Human can resume from where it paused. |
| Resume  | When paused or returning to a prior session.| Pick up at the same step. Already-completed substeps are skipped.       |

A workflow is **resumable across sessions**. If the human leaves the UI, the
agent SHOULD email/notify them when their attention is needed (a checkpoint
is reached, an approver is overdue, the regulator returns an error).

---

## Data Flow Summary

```
Trigger:    { entity, isReplacement, departingDirector, lastWorkingDay, filingDeadline }
   ↓
Step 1:     selectedCandidate
   ↓
Step 2a:    appointmentNric, appointmentEffectiveDate    (other fields preloaded from Workday)
Step 2b:    consentDocumentSent: true                   (document content stored as draft + signed copy)
   ↓
Step 3a:    confirmedApprovers: Approver[]
Step 3b:    boardResolutionSent: true                   (resolution content stored as draft + signed copy)
   ↓
Step 4:     votes: ApproverVote[] (each carries time + status)  →  signed resolution artifact
   ↓
Step 5:     filingSubsteps: AgenticSubstep[] (3) → regulator receipt
   ↓
Step 6:     entitySubsteps: AgenticSubstep[] (1 or 2)  → entity register entries
   ↓
Workflow complete: archived with full audit trail.
```

The full state shape is documented in `04-workflow-engine.md`.

---

## Human-in-the-Loop Checkpoints (Summary)

The following actions MUST be deliberate human actions in any channel. Bypass
removes the legal audit trail.

1. Confirm selected candidate (Step 1).
2. Save appointee data including NRIC (Step 2a).
3. Send consent document to appointee for signature (Step 2b).
4. Confirm approver list (Step 3a).
5. Approve & send Board Resolution (Step 3b).

After the Board Resolution is sent, the workflow may run to completion
without further human input — but the human can pause, cancel (before
filing succeeds), or intervene at any time.
