# 01 — Workflow Overview, Persona & Operating Model

This document defines what the **Director Appointment** workflow accomplishes,
who it serves, and the operating principles that any implementation — UI-driven,
chat-driven, or deterministic backend — must respect. It is intentionally
channel-agnostic: an agent reading these docs should be able to render the
same workflow as a guided web UI, a conversational chat thread, a Slack/Teams
bot, an email-driven approval process, or a back-office state machine.

---

## What This Workflow Does

The workflow appoints a new director to a single legal entity, end to end:

1. Detects or accepts a **trigger** (a director resignation, a board decision
   to add a new seat, a regulatory deadline) and frames the problem.
2. **Identifies a qualified replacement candidate** by querying authoritative
   HR data and screening against jurisdictional eligibility rules.
3. **Collects the appointment data** required by the entity register and the
   regulator (personal particulars, effective date, statutory consent).
4. **Configures approvers and the Board Resolution** that will be sent for
   signature.
5. **Routes the resolution for board approval** and tracks each vote.
6. **Files the regulatory documents** with the appropriate authority.
7. **Updates the entity records** (resignation + appointment) and closes the
   workflow.

The scope of this workflow is **one appointment at a time, into one entity**.
The worked example throughout these docs is replacing **Wei "David" Chen** as
director of **Pacific Polymer Logistics Pte. Ltd.** (Singapore), but every
rule generalizes to other jurisdictions and to "new seat" appointments.

---

## Operating Model — Agent-Led, Human-Confirmed

The workflow is **not** a form the user fills out top-to-bottom. It is an
**agent-led process** with explicit human checkpoints. Three classes of actor
participate:

| Actor          | Role                                                                                         |
|----------------|----------------------------------------------------------------------------------------------|
| **Agent**      | Detects the trigger, gathers data, drafts documents, runs autonomous phases, narrates state. |
| **Human (CoSec)** | Reviews, edits, and **explicitly confirms** at every checkpoint that has legal weight.    |
| **Systems**    | Workday (HR source), ACRA (regulator), Entity Management (corporate record), Board Portal.   |

The **human is in the loop**, not in the driver's seat. The agent does as much
as possible and pauses at clearly defined gates. Implementations of this
workflow MUST preserve the human checkpoints listed in `03-user-journey.md`
even if everything else is automated; bypassing them removes the legal audit
trail.

### Phases of autonomy

| Phase                      | Who drives                                  |
|----------------------------|---------------------------------------------|
| Trigger detection          | Agent (via integration signals or chat)     |
| Candidate identification   | Agent ranks; **human selects**              |
| Appointee data collection  | Agent pre-fills; **human supplies missing data + confirms** |
| Document drafting          | Agent drafts; **human reviews/edits**       |
| Approver selection         | Agent suggests; **human confirms**          |
| Board approval (voting)    | Autonomous — agent monitors                 |
| Regulatory filing          | Autonomous — agent files                    |
| Entity record updates      | Autonomous — agent records                  |
| Completion summary         | Agent reports                               |

---

## Domain Glossary

| Term | Definition |
|------|------------|
| **Entity** | A legal company registered in a specific jurisdiction (e.g. Singapore Pte. Ltd., Delaware LLC). The parent organization manages a portfolio of these. |
| **Director** | A member of an entity's board of directors. |
| **Departing director** | The director whose seat is being vacated (relevant only to replacement appointments). |
| **Appointee** | The person being appointed as the new director. |
| **Appointment** | The legal act of adding an individual to an entity's board. |
| **Replacement** | A variant where a departing director is replaced by an appointee. Adds a resignation record on top of the appointment record. |
| **Board Resolution** | A formal document recording the board's decision to appoint a director. Drafted by the agent, reviewed/edited by the human, sent to selected approvers for electronic signature. |
| **Consent to Act** | A statutory form (Singapore: **Form 45**, pursuant to s.145(5) Companies Act) where the appointee consents to serve. May or may not be filed with the regulator depending on jurisdiction. |
| **Regulatory filing** | Submission of the signed Board Resolution and any required statutory forms to the relevant authority (Singapore: ACRA via BizFile+; elsewhere: state/national equivalent). |
| **Approver** | A board member who must vote to approve the resolution. Organized by committee. |
| **Committee** | A standing board committee (Nomination, Audit, Compensation, Governance). The agent suggests an approver set drawn from one committee; the human can add members from other committees. |
| **Workday** | The HR system of record. Source of employment events (resignations, hires) and personal particulars (address, DOB, nationality, residency status). |
| **NRIC** | National Registration Identity Card number (Singapore). Required by ACRA and the Entity Register, **not** stored in Workday — must be collected from the human. |
| **Entity Register** | The internal corporate record that mirrors what is filed with regulators. Updated as the final step of the workflow. |

---

## User Persona — Sarah, Corporate Secretary

| Attribute       | Detail                                                                                          |
|-----------------|-------------------------------------------------------------------------------------------------|
| **Name**        | Sarah                                                                                           |
| **Title**       | Corporate Secretary / Governance Officer                                                        |
| **Employer**    | Acme, Inc. (parent holding company)                                                             |
| **Scope**       | 6 subsidiaries across the US, Ireland, Netherlands, and Singapore                               |
| **Day-to-day**  | Board calendar, minutes, statutory filings, entity hygiene; jumps between Workday, the entity register, ACRA/BizFile+, and the board portal |
| **Pain points** | Coordinating across jurisdictions; tracking approval status across email/portal; manual document prep; meeting deadlines (e.g. ACRA's 14-day window) |
| **Tech comfort**| Proficient with SaaS; expects modern, responsive UX; comfortable with AI assistance but wants control over decisions with legal weight |
| **Goals**       | Reduce time-to-appointment; eliminate missed filings; maintain a clear audit trail            |

Sarah trusts the agent to do the rote work — pulling data, drafting documents,
chasing signatures, filing forms — but she wants a clear "I am about to send
this to the board" / "I am about to file this with ACRA" moment so she can
review what is being committed in her name.

---

## Core Design Principles (Channel-Agnostic)

These principles MUST be honored regardless of how the workflow is rendered.

1. **Trigger-driven, not page-driven.** The workflow starts because something
   happened in the world (a resignation event, a request from the chair) —
   not because the user navigated to a "create appointment" form.

2. **Agent does the discoverable work.** Anything the agent can pull from
   Workday, the entity register, prior appointments, or jurisdictional rule
   books, the agent SHOULD pull and present pre-filled. Never ask the human
   for data the system can already discover.

3. **Pre-fill, then ask only for the gaps.** When data collection is required,
   present what is already known as read-only context and prompt only for the
   genuinely missing fields (the canonical example is the **NRIC** for
   Singapore appointments — Workday does not hold it).

4. **Draft, don't blank-page.** Documents (Form 45, Board Resolution) are
   always drafted in full from known data. The human's role is to review and
   edit, not to compose. A "Replace with my own document" escape hatch MUST be
   available.

5. **Make checkpoints explicit.** Every action with legal or external
   consequence — sending the consent form, sending the resolution to the
   board, filing with the regulator — MUST be a deliberate, named action by
   the human (e.g. "Send for signature", "Approve & send", "File with ACRA").
   The system MUST NOT auto-fire any of these without explicit consent.

6. **Disable-after-commit.** Once a checkpoint is crossed, controls that
   precede it become read-only. The audit trail is linear; users do not
   silently change inputs after the artifact has left the building.

7. **Re-present accumulated state.** After any sub-flow (looking up a
   candidate, adding a person, replacing a document), the human MUST be
   returned to the main flow with prior selections still visible and
   editable. Never lose context.

8. **Jurisdiction-aware language.** Document names, regulatory bodies, filing
   instructions, and statutory references adapt to the entity's jurisdiction.
   "Form 45 / ACRA" in Singapore; "Articles of Amendment / state Secretary of
   State" in Delaware; etc. Drive this from the entity's `location`/`country`
   fields, not from the channel.

9. **Narrate state continuously.** The human MUST always be able to answer
   three questions at a glance: *What step am I on? What is the agent
   currently doing? What is up next?* In a UI this is a status panel; in
   chat this is a periodic status message; in a deterministic workflow this
   is the externally observable state.

10. **Long-running ≠ blocking.** The board-approval phase can take days.
    Filing can take hours. The workflow MUST be resumable across sessions
    and MUST NOT depend on the human keeping a tab open.

---

## Channel Guidance

The same workflow can be rendered into many channels. The mapping is:

### UI (current implementation — guided workspace)

- **Persistent global header** (tenant, app switcher, page title) at the top
  of every command-center and workflow view.
- **Workspace header** (back arrow + appointment title) directly below it.
- **3-pane workspace**:
  - Left: **Status Panel** — progress (n/6), step list with pulsing-dot
    activity indicator on in-progress steps, expandable substeps under the
    active step, and an "Up next" / "Processing" / "Workflow complete" card
    at the bottom.
  - Center: **Work Panel** — overview when no step is active; otherwise the
    step-specific surface (candidate cards, tabbed data + document editor,
    voting tracker, filing tracker, entity-update tracker).
  - Right: **AI Governance Assistant** — a chat rail with the same agent
    that drives the workflow, scoped to this appointment's context.

### Chat-first (chat agent, no graphical workspace)

- The agent opens by **summarizing the trigger** and offering the next step
  ("Do you want me to walk you through the shortlisted candidates?").
- Each step from `03-user-journey.md` becomes one or more conversational
  turns. The agent presents structured information (candidate cards, document
  drafts) inline and asks for explicit confirmation at every checkpoint.
- Documents (Form 45, Board Resolution) are sent to the human as attachments
  or links to a lightweight editor; "review and edit" is a sub-conversation,
  "Approve & send" is a confirmation prompt.
- Long-running phases (voting, filing, entity update) post **periodic
  status updates** (e.g. "2 of 4 approvers have signed") and a final
  completion message.

### Deterministic backend workflow (state machine / job orchestrator)

- Each step in `03-user-journey.md` is a state in the machine.
- Human checkpoints become **wait-for-event** transitions: the workflow pauses
  on `awaiting:appointee_confirmation`, `awaiting:resolution_approval`, etc.,
  and resumes when the corresponding event arrives (from any channel — UI,
  chat, email, API).
- Autonomous segments (voting simulation, filing, entity updates) are
  scheduled jobs with retry policies and timeouts.
- Side effects (Workday read, ACRA file, entity register write) are encoded
  as well-defined integration calls described in `04-workflow-engine.md`.
- The state model in `04-workflow-engine.md` is canonical; UI and chat both
  read/write the same state.

### Email / portal (deferred-confirmation channels)

- The agent uses email/portal for **approver-side actions** (approver
  receives the resolution, signs, returns). The CoSec's primary channel can
  still be UI or chat.
- Each emailed action MUST encode the workflow ID + step + actor so the
  state machine can correlate the response back to the right appointment.

---

## What This Workflow Is NOT

- It is **not** a multi-appointment or batch process. Bulk director changes
  are out of scope.
- It is **not** an officer/executive appointment workflow. Board directors
  only.
- It does **not** handle director compensation, equity grants, or D&O
  insurance — those are separate workflows that may be triggered after this
  one completes.
- It is **not** a substitute for legal counsel review. The human must still
  apply judgment for unusual situations (cross-border directors, contested
  resignations, conflict-of-interest cases).
