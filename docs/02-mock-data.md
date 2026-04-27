# 02 — Reference Data

This document defines the **canonical data** that any implementation of the
director appointment workflow operates on. It is channel-agnostic — the same
records back the UI workspace, a chat-driven walkthrough, and a deterministic
backend run.

The data is intentionally small and self-contained so it can be embedded in a
prototype, a script, or a fixture file without a database. Production
implementations should swap the static records below for live integrations
(Workday, the entity register, the regulator's e-filing API) while preserving
the **field shapes** described here.

---

## Parent Organization

**Acme, Inc.** — a global specialty chemicals and advanced materials
conglomerate operating through wholly-owned subsidiaries. The CoSec team at
Acme is the principal user of this workflow.

---

## Subsidiary Entities

The portfolio the CoSec manages.

| ID | Name                                    | Location                | Country     | Flag |
|----|-----------------------------------------|-------------------------|-------------|------|
| c1 | Acme Feedstock & Monomer, LLC           | Houston, Texas          | USA         | 🇺🇸  |
| c2 | VitaPlast Solutions, Ltd.               | Cork                    | Ireland     | 🇮🇪  |
| c3 | DuraFlow Composites, Inc.               | Auburn Hills, Michigan  | USA         | 🇺🇸  |
| c4 | Acme Circular Technologies B.V.         | Rotterdam               | Netherlands | 🇳🇱  |
| c5 | Pacific Polymer Logistics Pte. Ltd.     | Singapore               | Singapore   | 🇸🇬  |
| c6 | Acme Advanced Materials Holdings, LLC   | Wilmington, Delaware    | USA         | 🇺🇸  |

**Searchable by**: name, location, country.

The **worked example** throughout these docs targets entity `c5` (Pacific
Polymer Logistics Pte. Ltd., UEN `201812345K`). All Singapore-specific rules
(Form 45, ACRA, BizFile+, NRIC, 14-day filing window, residency requirements)
apply to this entity.

---

## Trigger Event — The Resignation

The workflow is **not** initiated by a user navigating to a "create
appointment" form. It is initiated by an event observed in the source HR
system. The example trigger:

```
event:                  workday.employment.resignation
employeeId:             p1
employeeName:           Wei "David" Chen
title:                  Vice President, Commercial Operations (APAC)
employer:               Pacific Polymer Logistics Pte. Ltd. (entity c5)
boardSeats:             [ entity:c5 — Director ]
lastWorkingDay:         2026-04-17
filingDeadline:         2026-05-01    (14 days after last working day; ACRA s.173(6))
detectedAt:             2026-04-03    (i.e. ~14 days before last working day)
```

When this event arrives, the agent SHOULD:

1. Recognize that the resigning employee currently holds a board seat (cross-reference Workday → entity register).
2. Frame an appointment workflow with `isReplacement = true` and `entity = c5`.
3. Surface the trigger to the human with the deadline and the framing message,
   and offer to start at Step 1 (Identify replacement candidate).

In a chat channel, this surfaces as the agent's opening message. In a
deterministic workflow, this is the inbound event that creates a new run.

> **Generalization**: a "new seat" trigger (no resignation, board decided to
> add a director) follows the same workflow with `isReplacement = false` —
> Step 6 records only the appointment, not a resignation.

---

## People (Workday-sourced employee directory)

A small pool of employees the agent can pull from Workday. Any of them may be
proposed as a candidate, and the departing director is also drawn from the
same pool.

| ID | Name                  | Title                                                       | Employer (entity)                       | Singapore resident |
|----|-----------------------|-------------------------------------------------------------|-----------------------------------------|--------------------|
| p1 | Wei "David" Chen      | Vice President, Commercial Operations (APAC)                | Pacific Polymer Logistics Pte. Ltd. (c5)| Yes (departing)    |
| p2 | Priya Nair            | Regional Finance Director, APAC                             | Pacific Polymer Logistics Pte. Ltd. (c5)| Yes                |
| p3 | James "Jim" Sterling  | Senior Director, Supply Chain & Logistics                   | Acme Feedstock & Monomer, LLC (c1)      | No                 |
| p4 | Elena Rossi           | General Counsel, Asia Pacific                               | VitaPlast Solutions, Ltd. (c2)          | No                 |
| p5 | Lim Pei Shan          | Director of Risk Management & Trade Compliance              | Pacific Polymer Logistics Pte. Ltd. (c5)| Yes                |
| p6 | Kenji Tanaka          | Head of Digital Transformation, APAC                        | Pacific Polymer Logistics Pte. Ltd. (c5)| **No**             |
| p7 | Siti Nurhaliza        | Human Resources Director, APAC                              | Pacific Polymer Logistics Pte. Ltd. (c5)| Yes                |
| p8 | Michael O'Connell     | Plant Manager — Jurong Island Compounding Facility          | Pacific Polymer Logistics Pte. Ltd. (c5)| Yes                |
| p9 | David Chenney         | Vice President, Manufacturing Operations                    | DuraFlow Composites, Inc. (c3)          | No                 |

**Searchable by**: name, title, employer, country/location.

---

## Workday-Sourced Particulars (Pre-fill Set)

For the recommended candidate (Priya Nair, p2), Workday holds the following
fields, which the agent SHOULD pre-fill into the appointee data form:

| Field               | Value (Priya Nair)                                  | Notes                                  |
|---------------------|-----------------------------------------------------|----------------------------------------|
| Full name           | Priya Nair                                          | From Workday                           |
| Position / title    | Regional Finance Director, APAC                     | From Workday                           |
| Email address       | priya.nair@pacificpolymer.sg                        | From Workday                           |
| Phone               | +65 9123 4567                                       | From Workday                           |
| Date of birth       | 12 March 1984                                       | From Workday                           |
| Nationality         | Singaporean                                         | From Workday                           |
| Residential address | 14 Nassim Road, #08-02, Singapore 258395            | From Workday                           |
| Residency status    | Ordinarily resident in Singapore                    | Derived from address + nationality     |

### The Gap That Drives Human Input — NRIC

| Field | Value | Notes |
|-------|-------|-------|
| **NRIC** | `S1234567D` (in the worked example) | **NOT in Workday.** ACRA requires it on Form 45 and the Notification of Change of Director. **The human MUST supply this.** |

The NRIC is the canonical **example of "ask only for the gap"**. Any
implementation MUST surface a clearly-labeled action-required affordance for
this single field rather than re-presenting the entire personal-data form.

### Effective Date

| Field | Default | Notes |
|-------|---------|-------|
| Effective date of appointment | None (must be confirmed by human) | The agent may suggest the day **after** the departing director's last working day (here: `2026-04-18`); the worked example uses `2026-04-20`. |

> **Generalization for other jurisdictions**: replace NRIC with the equivalent
> identity number (e.g. SSN/TIN in the US, PPS in Ireland, BSN in the
> Netherlands) and replace residency status with the locally relevant
> equivalent. The shape of the gap doesn't change — Workday rarely holds the
> regulator-required ID, so it MUST be collected from the human.

---

## Candidate Shortlist (Step 1 Output)

When the agent screens employees against the destination entity's
jurisdictional director-eligibility rules, it produces a **ranked shortlist**.
For the worked example (Singapore replacement at entity c5):

| Rank | Person ID | Name          | Match | Recommended | Eligibility flags                                                              |
|------|-----------|---------------|-------|-------------|--------------------------------------------------------------------------------|
| 1    | p2        | Priya Nair    | 94%   | **Yes**     | Singapore resident · No disqualifications · Finance background                 |
| 2    | p5        | Lim Pei Shan  | 87%   | No          | Singapore resident · No disqualifications · Risk & compliance expertise        |
| 3    | p6        | Kenji Tanaka  | 72%   | No          | **Non-resident — may not satisfy local director requirement** · No disqualifications |

### Match Score Rubric (Channel-Agnostic)

The match score is a number 0–100. Any implementation MAY compute it
differently; the rubric below is the prototype's heuristic.

| Component                                     | Weight |
|-----------------------------------------------|--------|
| Satisfies hard jurisdictional rules           | 60     |
| Functional fit (finance/risk/legal seniority) | 20     |
| Tenure / org seniority                        | 10     |
| No conflicts of interest                      | 10     |

A candidate scoring **< 75** with at least one hard-rule warning MUST be
displayed with a warning chip explaining the issue. A candidate scoring
**>= 90** with no warnings MAY be marked **Recommended**.

---

## Board Committees & Approvers

The board has four standing committees. The agent suggests the
**Nomination Committee** as the default approver set for director appointments;
the human can swap to another committee or pull individuals from any
committee.

### Nomination Committee — default approver source

| Value Key          | Name              | Initials | Role                       | Notes                                                                 |
|--------------------|-------------------|----------|----------------------------|-----------------------------------------------------------------------|
| robert-johnson     | Robert Johnson    | RJ       | Committee Chair            |                                                                       |
| margaret-sullivan  | Margaret Sullivan | MS       | Chief Executive Officer    |                                                                       |
| linda-williams     | Linda Williams    | LW       | Independent Director       |                                                                       |
| david-martinez     | David Martinez    | DM       | Independent Director       |                                                                       |
| james-davidson     | James Davidson    | JD       | Lead Independent Director  | **Disabled** — "Missing a saved signature template"                   |

The four enabled members above are the **default pre-selected approvers** for
the worked example.

### Audit Committee

| Value Key          | Name              | Initials | Role                  |
|--------------------|-------------------|----------|-----------------------|
| linda-williams     | Linda Williams    | LW       | Committee Chair       |
| thomas-chen        | Thomas Chen       | TC       | Independent Director  |
| sarah-patel        | Sarah Patel       | SP       | Independent Director  |
| david-martinez     | David Martinez    | DM       | Independent Director  |

### Compensation Committee

| Value Key          | Name              | Initials | Role                       |
|--------------------|-------------------|----------|----------------------------|
| david-martinez     | David Martinez    | DM       | Committee Chair            |
| robert-johnson     | Robert Johnson    | RJ       | Board Chair                |
| patricia-walsh     | Patricia Walsh    | PW       | Independent Director       |
| sarah-patel        | Sarah Patel       | SP       | Independent Director       |
| margaret-sullivan  | Margaret Sullivan | MS       | Chief Executive Officer    |

### Governance Committee

| Value Key          | Name              | Initials | Role                       | Notes                                                                 |
|--------------------|-------------------|----------|----------------------------|-----------------------------------------------------------------------|
| margaret-sullivan  | Margaret Sullivan | MS       | Committee Chair            |                                                                       |
| robert-johnson     | Robert Johnson    | RJ       | Board Chair                |                                                                       |
| thomas-chen        | Thomas Chen       | TC       | Independent Director       |                                                                       |
| patricia-walsh     | Patricia Walsh    | PW       | Independent Director       |                                                                       |
| linda-williams     | Linda Williams    | LW       | Independent Director       |                                                                       |
| james-davidson     | James Davidson    | JD       | Lead Independent Director  | **Disabled** — "Missing a saved signature template"                   |

> Members can appear on multiple committees (e.g. David Martinez on
> Nomination, Audit, and Compensation). De-duplicate by `value-key` when
> aggregating selected approvers.

### Disabled members

A member MAY be disabled with a human-readable reason. Disabled members:

- MUST NOT be addable as approvers.
- MUST be displayed (not hidden) so the human understands why they are unavailable.
- MUST show the reason string verbatim.

---

## Document Templates

### 1. Consent to Act as Director — Form 45 (Singapore)

A two-page statutory document, drafted by the agent, populated from
the Workday particulars + human-supplied NRIC + effective date.

**Key sections** (channel-agnostic):

- **Header** — "CONSENT TO ACT AS DIRECTOR" + statutory citation
  (s.145(5), Companies Act, Cap. 50).
- **Company particulars** — name + UEN.
- **Statutory declaration** — appointee consents, accepts responsibilities,
  affirms non-disqualification.
- **Effective date** — pulled from human-supplied effective date; falls back
  to "[date to be confirmed]" until provided.
- **Particulars of director** — name, residential address, NRIC/passport,
  nationality, signature placeholder.
- **Date of execution** — prefilled with today's date.

The document is editable inline. The human may also **replace** it with their
own uploaded document (PDF, DOC, DOCX, TXT, HTML). Text-format uploads MUST
be loaded into the editor; binary uploads MUST be attached as the canonical
consent document with an editor-side note ("the original Form 45 template is
still shown for reference").

**Filename**: `Consent_to_Act_{AppointeeShort}.pdf`.

### 2. Board Resolution

Drafted by the agent from the same data plus the resolved approver list. The
resolution is what gets sent to the board for signature.

**Key sections** (channel-agnostic):

- **Header** — "WRITTEN RESOLUTION OF THE BOARD OF DIRECTORS" + the entity
  name + UEN + statutory citation.
- **Section 1 — Cessation of Director** — acknowledges the departing
  director's resignation with effective date (last working day).
- **Section 2 — Appointment of Director** — appointee's full name + NRIC +
  address + effective date.
- **Section 3 — Consent to Act** — notes that Form 45 has been executed.
- **Section 4 — Statutory Filings** — directs the CoSec to file Form 45 with
  ACRA within 14 days, update the Register of Directors (s.173(1)), update
  BizFile+, and execute related documents.
- **Section 5 — General Authority** — boilerplate authority for directors /
  CoSec to give effect to the resolutions.
- **Schedule A — Particulars of New Director** — full name, NRIC, residential
  address, nationality, date of appointment, designation.
- **Signature blocks** — one per selected approver, in confirmed order.

The resolution is editable inline. After the human approves and sends, the
document MUST become read-only and signature blocks MUST update as approvers
respond.

**Filename**: `Board_Resolution_{CompanyShort}.pdf`.

### 3. Notification of Change of Director — Form 45 (Singapore)

Generated automatically from the same data set when the filing step begins.
This is the regulator-facing notification submitted to ACRA. It is **not**
edited by the human — it is a derivative of the prior two documents.

**Filename**: `Form_45_{CompanyShort}.pdf` (Singapore) or
`Regulatory_Filing_{CompanyShort}.pdf` (other jurisdictions, generic naming).

---

## Worked Example — Filled Values

These are the values used end-to-end in the prototype. Implementations should
use the same values when reproducing the demo.

| Field                     | Value                                                |
|---------------------------|------------------------------------------------------|
| Entity                    | Pacific Polymer Logistics Pte. Ltd. (c5)             |
| UEN                       | `201812345K`                                         |
| Jurisdiction              | Singapore (ACRA)                                     |
| Departing director        | Wei "David" Chen (p1)                                |
| Last working day          | 2026-04-17                                           |
| Filing deadline           | 2026-05-01 (14 days)                                 |
| Selected appointee        | Priya Nair (p2)                                      |
| NRIC (human-supplied)     | `S1234567D`                                          |
| Residential address       | 14 Nassim Road, #08-02, Singapore 258395             |
| Nationality               | Singaporean                                          |
| Effective date            | 2026-04-20                                           |
| Selected committee        | Nomination Committee                                 |
| Pre-selected approvers    | Robert Johnson, Margaret Sullivan, Linda Williams, David Martinez |
| Filing deadline (display) | "April 17, 2026 (14 days)"                           |

---

## Activity History (For Surface Continuity)

These represent prior CoSec activity that an implementation MAY display in a
command-center "recent activity" rail to give the surface a sense of ongoing
work. They are reference data only — they have no behavior.

| Title                                  | Preview                                                  | Age     | Has update    | Workflow type        |
|----------------------------------------|----------------------------------------------------------|---------|---------------|----------------------|
| Director Appointment — Wei Chen        | Replace director David Chen at Pacific Polymer Logistics | 2 days  | Yes (3h ago)  | Director Appointment |
| Board Resolution Review                | Review draft resolution for Q1 strategic initiative      | 3 days  | No            | —                    |
| Entity Formation — Delaware LLC        | Set up a new Delaware LLC for our real estate holdings   | 5 days  | Yes (1h ago)  | Entity Formation     |
| Corporate Governance Best Practices    | What are the latest ESG reporting requirements?          | 7 days  | No            | —                    |
| Annual Compliance Filing — Singapore   | File annual return for Pacific Polymer                   | 10 days | No            | Compliance Filing    |
| Board Meeting Preparation              | Prepare materials for next week's board meeting          | 12 days | No            | —                    |
| Officer Appointment — CFO              | Appoint Sarah Martinez as Chief Financial Officer        | 15 days | No            | Officer Appointment  |
| Fiduciary Duties Research              | Fiduciary duties of directors under Delaware law         | 18 days | No            | —                    |
| Board Resolution — M&A Transaction     | Draft resolution approving the acquisition of TechCorp   | 21 days | No            | Board Resolution     |
| Insider Trading Policy Update          | Review insider trading policy for new SEC rules          | 24 days | No            | —                    |
| Share Transfer — Private Sale          | Process share transfer between John Smith and ABC Holdings | 27 days | No          | Share Transfer       |
| D&O Insurance Research                 | Compare D&O insurance options for board coverage         | 30 days | No            | —                    |

---

## Simulation Timing (Prototype)

Used during the autonomous segments (board approval → filing → entity
updates) to create realistic-looking progress. Production implementations
replace these with real wall-clock waits on integration callbacks.

The full simulation runs ~8 seconds end-to-end:

| Tick (ms) | Event                                          |
|-----------|------------------------------------------------|
|       800 | Approver 1 votes (Robert Johnson)              |
|     1,800 | Approver 2 votes (Margaret Sullivan)           |
|     3,000 | Approver 3 votes (Linda Williams)              |
|     4,000 | Approver 4 votes (David Martinez)              |
|     4,500 | Board approval → completed; Filing → in progress; Filing substep 1 → in progress |
|     5,200 | Filing substep 1 → completed; substep 2 → in progress |
|     5,900 | Filing substep 2 → completed; substep 3 → in progress |
|     6,500 | Filing substep 3 → completed; Filing → completed; Update entities → in progress; resign substep → in progress |
|     7,200 | Resignation recorded; appointment substep → in progress |
|     7,800 | Appointment recorded; Update entities → completed; workflow complete |

Each completion writes a real-time `toLocaleTimeString` timestamp at the moment
of completion. Approval timestamps in the UI may use shuffled cosmetic labels
(e.g. `Jan 7 2:30 PM`, `Jan 8 10:15 AM`) drawn from a fixed pool — see
`04-workflow-engine.md`.
