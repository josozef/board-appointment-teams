/**
 * Canonical workflow types. Field names match docs/04-workflow-engine.md
 * exactly so the same shape can back UI, chat, and deterministic backends.
 */

export type Jurisdiction = 'SG' | 'US-DE' | 'IE' | 'NL'

export interface EntityRef {
  id: string
  name: string
  uen: string
  location: string
  country: string
  jurisdiction: Jurisdiction
}

export interface PersonRef {
  id: string
  name: string
  title: string
  employer?: EntityRef
}

export interface Candidate extends PersonRef {
  matchPct: number
  resident: boolean
  notes: string
  recommended?: boolean
}

export interface Approver {
  id: string
  name: string
  initials: string
  title: string
  email: string
  fromCommittee: string
}

export interface Trigger {
  source:
    | 'workday.resignation'
    | 'workday.new-seat'
    | 'human-request'
    | 'scheduled-review'
  detectedAt: string
  payload: Record<string, unknown>
  framing: string
  filingDeadline: string
}

export type WorkflowStepId =
  | 'identify-candidate'
  | 'collect-data'
  | 'select-approvers'
  | 'board-approval'
  | 'filing'
  | 'update-entities'

export interface WorkflowStep {
  id: WorkflowStepId
  name: string
  status: 'not_started' | 'in_progress' | 'completed'
  substeps?: string[]
}

export interface ApproverVote {
  id: string
  name: string
  title: string
  status: 'pending' | 'approved' | 'declined'
  time: string | null
}

export interface AgenticSubstep {
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  time: string | null
}

export interface ConsentDocument {
  content: string
  sent: boolean
  sentAt: string | null
  replacedByUpload: string | null
  signedAt: string | null
}

export interface BoardResolution {
  content: string
  sent: boolean
  sentAt: string | null
  signedAt: string | null
}

export interface AppointmentWorkflow {
  id: string
  status: 'active' | 'paused' | 'cancelled' | 'complete'
  createdAt: string
  updatedAt: string

  trigger: Trigger
  triggerAcknowledged: boolean
  entity: EntityRef
  isReplacement: boolean
  departingDirector: PersonRef | null

  selectedCandidate: Candidate | null
  candidatePool: Candidate[]
  appointmentNric: string | null
  appointmentEffectiveDate: string | null

  consentDocument: ConsentDocument
  approvers: {
    confirmed: boolean
    selected: Approver[]
  }
  boardResolution: BoardResolution

  steps: WorkflowStep[]

  agentic: {
    active: boolean
    paused: boolean
    votes: ApproverVote[]
    filingSubsteps: AgenticSubstep[]
    entitySubsteps: AgenticSubstep[]
    processComplete: boolean
  }
}
