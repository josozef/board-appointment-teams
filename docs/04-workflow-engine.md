# 04 — Workflow Engine, State Model & Integrations

This document defines the **runtime model** of the director appointment
workflow: data shapes, state machine, autonomous-segment orchestration,
integrations with external systems, and timing. It is independent of any
particular UI framework or chat platform — UI, chat, and deterministic
backend implementations all read and write the same state.

---

## State Shape — Top Level

A workflow run is a single object that carries all state. Implementations
MAY persist this in a database, an event log, or in-memory; the shape is
canonical.

```
AppointmentWorkflow = {
  id:                  string                 // workflow run id
  status:              'active' | 'paused' | 'cancelled' | 'complete'
  createdAt:           ISO timestamp
  updatedAt:           ISO timestamp

  trigger:             Trigger                // see below
  entity:              EntityRef
  isReplacement:       boolean
  departingDirector:   PersonRef | null

  selectedCandidate:   PersonRef | null       // Step 1 output
  appointmentNric:     string | null          // Step 2a — required by regulator
  appointmentEffectiveDate: string | null     // Step 2a — ISO date or "TBC"

  consentDocument: {
    content:           string                 // editable HTML (canonical draft)
    sent:              boolean                // Step 2b checkpoint
    sentAt:            ISO timestamp | null
    replacedByUpload:  string | null          // filename, if user uploaded
    signedAt:          ISO timestamp | null   // populated when appointee returns signature
  }

  approvers: {
    confirmed:         boolean                // Step 3a checkpoint
    selected:          Approver[]             // confirmed approver list
  }

  boardResolution: {
    content:           string                 // editable HTML
    sent:              boolean                // Step 3b checkpoint
    sentAt:            ISO timestamp | null
    signedAt:          ISO timestamp | null   // populated when last vote arrives
  }

  steps:               WorkflowStep[]         // see below — fixed shape, length 6

  agentic: {
    active:            boolean
    paused:            boolean
    votes:             ApproverVote[]         // per-approver vote tracking (Step 4)
    filingSubsteps:    AgenticSubstep[]       // Step 5 substeps
    entitySubsteps:    AgenticSubstep[]       // Step 6 substeps
    processComplete:   boolean
  }
}
```

### `Trigger`

```
Trigger = {
  source:      'workday.resignation' | 'workday.new-seat' | 'human-request' | 'scheduled-review'
  detectedAt:  ISO timestamp
  payload:     object       // raw event from the source system, retained for audit
  framing:     string       // human-readable opening message ("Workday has reported…")
  filingDeadline: ISO date  // computed from jurisdictional rules
}
```

### `EntityRef`

```
EntityRef = {
  id:          string       // e.g. "c5"
  name:        string       // e.g. "Pacific Polymer Logistics Pte. Ltd."
  uen:         string       // local registration number
  location:    string       // city
  country:     string       // country
  jurisdiction: string      // for rule routing — e.g. "SG", "US-DE", "IE"
}
```

### `PersonRef`

```
PersonRef = {
  id:          string
  name:        string
  title:       string
  employer?:   EntityRef
}
```

### `Approver`

```
Approver = {
  id:          string       // value-key, e.g. "robert-johnson"
  name:        string
  initials:    string
  title:       string
  email:       string
  fromCommittee: string     // committee from which the agent first picked them
}
```

### `WorkflowStep`

```
WorkflowStep = {
  id:          'identify-candidate'
             | 'collect-data'
             | 'select-approvers'
             | 'board-approval'
             | 'filing'
             | 'update-entities'
  name:        string
  status:      'not_started' | 'in_progress' | 'completed'
  substeps?:   string[]     // human-readable substep labels (display)
}
```

The 6 steps are fixed in order. The status enum on a step transitions
strictly forward: `not_started → in_progress → completed`. There is no
"failed" status on a step in the current model — failures are surfaced via
agent messages, and recovery either retries within the same step or
cancels the workflow.

### `ApproverVote`

```
ApproverVote = {
  id:          string       // matches Approver.id
  name:        string
  title:       string
  status:      'pending' | 'approved' | 'declined'   // 'declined' reserved for production
  time:        string | null    // human-readable timestamp at vote time
  vote?:       'Approved' | 'Rejected' | 'Abstained' // production only
}
```

### `AgenticSubstep`

```
AgenticSubstep = {
  name:        string
  status:      'pending' | 'in_progress' | 'completed' | 'failed'
  time:        string | null    // populated on completion or failure
  error?:      string           // populated on failure
}
```

---

## Step → State Mapping

The 6-step workflow maps to a deterministic state machine. Each step has a
canonical state name plus optional sub-states for the autonomous segments.

| Step | Canonical state                  | Wait-for-event (if any)         | Resume event             |
|------|----------------------------------|---------------------------------|--------------------------|
| 0    | `triggered`                       | (auto-advances on creation)     | —                        |
| 1    | `identifying-candidate`           | `awaiting-candidate-selection`  | `selectCandidate`        |
| 2a   | `collecting-appointee-data`       | `awaiting-appointee-data`       | `submitAppointeeData`    |
| 2b   | `drafting-consent`                | `awaiting-consent-send`         | `sendConsentForSignature`|
| 3a   | `selecting-approvers`             | `awaiting-approver-confirmation`| `confirmApprovers`       |
| 3b   | `drafting-resolution`             | `awaiting-resolution-send`      | `sendResolution`         |
| 4    | `awaiting-board-approval`         | (incremental: `voteCast` events)| `voteCast` × N           |
| 5    | `filing`                          | (jobs run in sequence)          | n/a (autonomous)         |
| 6    | `updating-entities`               | (jobs run in sequence)          | n/a (autonomous)         |
| End  | `complete`                        | —                               | —                        |

Cancellation is allowed in any state up to and including `filing` (subject to
the rule that the regulator may already have the filing). It transitions to
`cancelled` and stops further work.

---

## State Transition Rules

### Step 1 — Identify Candidate

```
[triggered]
   → identifying-candidate          (auto on workflow creation)
   → awaiting-candidate-selection   (shortlist computed and presented)

(selectCandidate event)
   → step.identify-candidate.status = completed
   → step.collect-data.status      = in_progress
   → state: collecting-appointee-data
```

### Step 2 — Collect Data

Step 2 has two parallel checkpoints. Both must be satisfied to advance.

```
state: collecting-appointee-data    ↔  state: drafting-consent
       ↓                                    ↓
       awaiting-appointee-data              awaiting-consent-send
       (submitAppointeeData event)          (sendConsentForSignature event)
       ↓                                    ↓
       collectDataTabStatus.entities=true   collectDataTabStatus.consent=true

(when both true)
   → step.collect-data.status      = completed
   → step.select-approvers.status  = in_progress
   → state: selecting-approvers
```

### Step 3 — Configure Approvers

Step 3 has the same parallel-checkpoint pattern.

```
state: selecting-approvers          ↔  state: drafting-resolution
       ↓                                    ↓
       awaiting-approver-confirmation       awaiting-resolution-send
       (confirmApprovers event)             (sendResolution event)
       ↓                                    ↓
       approverTabStatus.approversConfirmed approverTabStatus.resolutionSent

(when both true)
   → step.select-approvers.status  = completed
   → step.board-approval.status    = in_progress
   → state: awaiting-board-approval
   → agentic.active = true
   → enqueue Step 4 simulation/jobs
```

### Step 4 — Board Approval (autonomous)

```
(per voteCast event from board portal / signature service / simulator)
   → votes[i].status = 'approved'
   → votes[i].time   = now()

(when all votes.status = 'approved')
   → boardResolution.signedAt = now()
   → step.board-approval.status = completed
   → step.filing.status         = in_progress
   → state: filing
```

### Step 5 — Regulatory Filing (autonomous)

```
state: filing
   substep[0] (Download signed documents)   pending → in_progress → completed
   substep[1] (e-File with ACRA)            pending → in_progress → completed
   substep[2] (Confirm filing)              pending → in_progress → completed

(any substep failure → state: filing-failed; notify human; halt)

(all substeps completed)
   → step.filing.status         = completed
   → step.update-entities.status= in_progress
   → state: updating-entities
```

### Step 6 — Update Entity Records (autonomous)

```
state: updating-entities
   if isReplacement:
     substep "Record resignation — {departing director}"  pending → in_progress → completed
   substep "Record appointment — {appointee}"             pending → in_progress → completed

(all substeps completed)
   → step.update-entities.status = completed
   → agentic.processComplete     = true
   → state: complete
```

### Cancellation

```
(cancelWorkflow event, allowed in states up to and including 'filing')
   → status = 'cancelled'
   → halt any active simulation/jobs
   → notify human with current step + reason
```

### Pause / Resume

```
(pauseWorkflow event in autonomous segment)
   → agentic.paused = true
   → halt simulation/jobs (preserve substep statuses as-is)

(resumeWorkflow event)
   → agentic.paused = false
   → continue from the next not-yet-completed substep
```

---

## Integration Contracts

The workflow interacts with four external systems. Each is described as an
**operation** (verb + payload) so it can be implemented synchronously,
asynchronously, or as a stub depending on the channel.

### Workday (HR System of Record)

| Operation                          | Direction | Used in step | Payload (in)                          | Payload (out) / event                                                  |
|------------------------------------|-----------|--------------|---------------------------------------|------------------------------------------------------------------------|
| `subscribeResignationEvents`       | inbound   | 0            | filter: { entityIds }                 | event: `{ employeeId, entityId, lastWorkingDay, ...}`                  |
| `getEmployee(employeeId)`          | outbound  | 1            | employeeId                            | full employee record (name, title, address, DOB, nationality, residency)|
| `searchEmployees(filter)`          | outbound  | 1            | { entityId, eligibleTitles, minTenure } | list of candidate employees                                          |

### Entity Register / Entity Management

| Operation                          | Direction | Used in step | Payload (in)                          | Payload (out)                                                          |
|------------------------------------|-----------|--------------|---------------------------------------|------------------------------------------------------------------------|
| `getEntity(entityId)`              | outbound  | 0–1          | entityId                              | full entity record (name, UEN, jurisdiction, registered office)        |
| `getDirectors(entityId)`           | outbound  | 0            | entityId                              | list of current directors (used to confirm departing director)         |
| `recordResignation(entityId, p)`   | outbound  | 6            | { entityId, personId, effectiveDate } | confirmation + new register version                                    |
| `recordAppointment(entityId, p)`   | outbound  | 6            | { entityId, personRef, effectiveDate } | confirmation + new register version                                   |

### Regulator (e.g. ACRA / BizFile+)

| Operation                          | Direction | Used in step | Payload (in)                          | Payload (out)                                                          |
|------------------------------------|-----------|--------------|---------------------------------------|------------------------------------------------------------------------|
| `submitForm45ChangeOfDirector`     | outbound  | 5            | signed resolution + Form 45 + PDFs    | filing receipt: `{ ackNumber, filedAt }`                               |
| `getFilingStatus(ackNumber)`       | outbound  | 5            | ackNumber                             | { state: pending|accepted|rejected, messages[] }                       |

### Board Portal / Signature Service

| Operation                          | Direction | Used in step | Payload (in)                          | Payload (out) / event                                                  |
|------------------------------------|-----------|--------------|---------------------------------------|------------------------------------------------------------------------|
| `sendForSignature(doc, recipients)`| outbound  | 2b, 3b       | document + per-approver email/role    | per-recipient send receipts                                            |
| `subscribeSignatureEvents`         | inbound   | 4            | documentId                            | event: `voteCast` `{ approverId, vote, timestamp }`                    |

Implementations MAY collapse multiple integrations into a single integration
hub, but the operation contracts above are canonical for the workflow.

---

## Simulation Timing (Prototype)

The prototype runs the autonomous segment as a single ~8-second sequence to
exercise the UI without waiting for real signatures or filings.

| Tick (ms) | Event                                                                      |
|-----------|----------------------------------------------------------------------------|
|       800 | Approver 1 votes (`Robert Johnson`)                                         |
|     1,800 | Approver 2 votes (`Margaret Sullivan`)                                      |
|     3,000 | Approver 3 votes (`Linda Williams`)                                         |
|     4,000 | Approver 4 votes (`David Martinez`)                                         |
|     4,500 | Step 4 → completed; Step 5 → in_progress; filing substep 0 → in_progress    |
|     5,200 | filing substep 0 → completed; substep 1 → in_progress                       |
|     5,900 | filing substep 1 → completed; substep 2 → in_progress                       |
|     6,500 | filing substep 2 → completed; Step 5 → completed; Step 6 → in_progress; entity substep 0 → in_progress |
|     7,200 | entity substep 0 → completed; substep 1 → in_progress                       |
|     7,800 | entity substep 1 → completed; Step 6 → completed; workflow → complete       |

Each completion writes a real-time `toLocaleTimeString` timestamp at the
moment of completion (i.e. the displayed time is the wall-clock at that tick).

### Approval Timestamp Pool (Display Labels)

For implementations that want richer-looking timestamps than wall-clock at
demo time, the prototype shuffles labels from this pool and assigns them to
approvers in vote order:

```
Jan 7, 2:30 PM
Jan 8, 10:15 AM
Jan 8, 3:45 PM
Jan 8, 4:30 PM
Jan 9, 9:00 AM
```

Other fixed display labels:
- `Create Board Resolution` — `Jan 7, 9:00 AM`
- `Send to board members`   — `Jan 7, 9:15 AM`
- Entity update timestamps — real-time `toLocaleString()` at completion.

These labels are cosmetic — they don't correspond to real clock time.

---

## Production Behavior Notes

The prototype simulation is replaced by real integrations. The state model
is identical; the timing and event sources differ.

### Step 4 — Real Voting

- `voteCast` events arrive over hours or days, not milliseconds.
- The workflow MUST be durable across process restarts. State persisted to
  a database, not memory.
- A vote of `Rejected` MUST be propagated to the human and trigger a
  decision: re-route to a different approver, withdraw the resolution, or
  cancel the workflow. The current model does not auto-handle rejection —
  it requires an explicit human resolution.
- Reminders MAY be issued by the agent if a vote has been pending past a
  configured SLA (e.g. > 48 h).

### Step 5 — Real Filing

- `submitForm45ChangeOfDirector` is a regulator API call. In Singapore this
  is BizFile+; in other jurisdictions it varies.
- `getFilingStatus` MAY be polled until the regulator returns
  `accepted` or `rejected`. On `rejected`, the workflow transitions to
  `filing-failed` with the regulator's messages attached.
- The 14-day filing deadline (Singapore) MUST be tracked: if filing has not
  been initiated by `filingDeadline - 3 days`, the agent SHOULD escalate
  to the human.

### Step 6 — Real Entity Updates

- `recordResignation` and `recordAppointment` MUST be transactional with
  respect to the entity's effective dates. If the entity register is
  multi-version, both records SHOULD share a single change-set.
- On any failure, the workflow MUST NOT be marked complete. The human is
  notified and the substeps can be retried.

---

## Audit Trail Requirements

Every state transition and human checkpoint MUST be persisted with:

- `timestamp` (server-side, monotonic).
- `actor` (`agent`, `user:{userId}`, or `integration:{name}`).
- `event` (`selectCandidate`, `submitAppointeeData`, `voteCast`, etc.).
- `payload` (the data that drove the transition).
- `before` / `after` state snapshots for human-driven transitions.

Documents (consent, resolution) MUST be versioned. Drafts and final signed
copies MUST both be retained. Replacement uploads MUST be retained alongside
the original draft, not in place of it.

The full transition log + document versions constitute the **audit trail**
that the CoSec relies on. Implementations MUST be able to render this trail
on demand from a single workflow run id.

---

## Backwards Compatibility

Earlier prototype models (see legacy `processSteps` shape) used a 3-phase
model (Approval → Filing → Entity Updates) with the user driving data
collection. Implementations migrating from that model:

- Collapse the prior "data collection" UX into Step 1 + Step 2 of the new
  model.
- Replace the prior "manual filing" checkpoint with the autonomous Step 5
  unless local policy still requires manual filing — in which case keep an
  explicit `awaiting-filing-confirmation` state.
- Map prior `boardResolution.docLink = 'board-resolution-signed'` to the new
  `boardResolution.signedAt` timestamp.

The new model is a strict superset of the old one's required functionality.
