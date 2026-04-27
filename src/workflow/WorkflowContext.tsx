import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  AgenticSubstep,
  AppointmentWorkflow,
  ApproverVote,
  Candidate,
  WorkflowStepId,
} from './types'
import { buildInitialWorkflow, ROBERT_JOHNSON } from './fixtures'
import type { PersonaId } from '../personas/personas'

const ROBERT_VOTE_AUTOMATION_DELAY_MS = 600
const REMAINING_VOTES_INTERVAL_MS = 1100
const FILING_STEP_INTERVAL_MS = 700
const ENTITY_STEP_INTERVAL_MS = 700

type Action =
  | { type: 'START_WORKFLOW' }
  | { type: 'SELECT_CANDIDATE'; candidate: Candidate }
  | { type: 'SUBMIT_APPOINTMENT_DATA'; nric: string; effectiveDate: string }
  | { type: 'SEND_CONSENT' }
  | { type: 'SIGN_CONSENT' }
  | { type: 'CONFIRM_APPROVERS' }
  | { type: 'SEND_RESOLUTION' }
  | { type: 'CAST_VOTE'; approverId: string; vote: 'approved' | 'declined' }
  | { type: 'PROGRESS_FILING'; index: number; status: AgenticSubstep['status'] }
  | { type: 'PROGRESS_ENTITY'; index: number; status: AgenticSubstep['status'] }
  | { type: 'ADVANCE_STEP'; completed: WorkflowStepId; next: WorkflowStepId | null }
  | { type: 'COMPLETE_PROCESS' }

const formatTime = () =>
  new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

function setStep(
  workflow: AppointmentWorkflow,
  id: WorkflowStepId,
  status: AppointmentWorkflow['steps'][number]['status'],
): AppointmentWorkflow {
  return {
    ...workflow,
    updatedAt: new Date().toISOString(),
    steps: workflow.steps.map((s) => (s.id === id ? { ...s, status } : s)),
  }
}

function reducer(state: AppointmentWorkflow, action: Action): AppointmentWorkflow {
  switch (action.type) {
    case 'START_WORKFLOW': {
      if (state.triggerAcknowledged) return state
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        triggerAcknowledged: true,
      }
    }

    case 'SELECT_CANDIDATE': {
      const next = setStep(
        setStep(state, 'identify-candidate', 'completed'),
        'collect-data',
        'in_progress',
      )
      return {
        ...next,
        selectedCandidate: action.candidate,
        agentic: {
          ...next.agentic,
          entitySubsteps: next.agentic.entitySubsteps.map((s, i) =>
            i === 1
              ? { ...s, name: `Record appointment — ${action.candidate.name}` }
              : s,
          ),
        },
      }
    }

    case 'SUBMIT_APPOINTMENT_DATA': {
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        appointmentNric: action.nric,
        appointmentEffectiveDate: action.effectiveDate,
        consentDocument: {
          ...state.consentDocument,
          content: state.consentDocument.content
            .replace(
              '[Appointee Name]',
              state.selectedCandidate?.name ?? '[Appointee Name]',
            )
            .replace('[NRIC]', action.nric)
            .replace('[Effective Date]', action.effectiveDate),
        },
        boardResolution: {
          ...state.boardResolution,
          content: state.boardResolution.content
            .replace(
              '[Appointee Name]',
              state.selectedCandidate?.name ?? '[Appointee Name]',
            )
            .replace('[Effective Date]', action.effectiveDate),
        },
      }
    }

    case 'SEND_CONSENT': {
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        consentDocument: {
          ...state.consentDocument,
          sent: true,
          sentAt: new Date().toISOString(),
        },
      }
    }

    case 'SIGN_CONSENT': {
      const after = setStep(
        setStep(state, 'collect-data', 'completed'),
        'select-approvers',
        'in_progress',
      )
      return {
        ...after,
        consentDocument: {
          ...after.consentDocument,
          signedAt: new Date().toISOString(),
        },
      }
    }

    case 'CONFIRM_APPROVERS': {
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        approvers: { ...state.approvers, confirmed: true },
      }
    }

    case 'SEND_RESOLUTION': {
      const after = setStep(
        setStep(state, 'select-approvers', 'completed'),
        'board-approval',
        'in_progress',
      )
      return {
        ...after,
        boardResolution: {
          ...after.boardResolution,
          sent: true,
          sentAt: new Date().toISOString(),
        },
        agentic: { ...after.agentic, active: true },
      }
    }

    case 'CAST_VOTE': {
      const votes: ApproverVote[] = state.agentic.votes.map((v) =>
        v.id === action.approverId
          ? { ...v, status: action.vote, time: formatTime() }
          : v,
      )
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        agentic: { ...state.agentic, votes },
      }
    }

    case 'PROGRESS_FILING': {
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        agentic: {
          ...state.agentic,
          filingSubsteps: state.agentic.filingSubsteps.map((s, i) =>
            i === action.index
              ? {
                  ...s,
                  status: action.status,
                  time: action.status === 'completed' ? formatTime() : s.time,
                }
              : s,
          ),
        },
      }
    }

    case 'PROGRESS_ENTITY': {
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        agentic: {
          ...state.agentic,
          entitySubsteps: state.agentic.entitySubsteps.map((s, i) =>
            i === action.index
              ? {
                  ...s,
                  status: action.status,
                  time: action.status === 'completed' ? formatTime() : s.time,
                }
              : s,
          ),
        },
      }
    }

    case 'ADVANCE_STEP': {
      let next = setStep(state, action.completed, 'completed')
      if (action.next) next = setStep(next, action.next, 'in_progress')
      return next
    }

    case 'COMPLETE_PROCESS': {
      return {
        ...state,
        status: 'complete',
        updatedAt: new Date().toISOString(),
        agentic: { ...state.agentic, processComplete: true },
      }
    }

    default:
      return state
  }
}

interface PerspectiveState {
  active: PersonaId
  manualOverride: boolean
}

type PerspectiveAction =
  | { type: 'AUTO_SET'; persona: PersonaId }
  | { type: 'MANUAL_SET'; persona: PersonaId }

function perspectiveReducer(
  state: PerspectiveState,
  action: PerspectiveAction,
): PerspectiveState {
  switch (action.type) {
    case 'MANUAL_SET':
      return { active: action.persona, manualOverride: true }
    case 'AUTO_SET':
      // Don't override a manual selection
      return state.manualOverride
        ? state
        : { active: action.persona, manualOverride: false }
    default:
      return state
  }
}

interface WorkflowContextValue {
  workflow: AppointmentWorkflow
  perspective: PersonaId
  setPerspective: (persona: PersonaId, manual?: boolean) => void
  resetManualOverride: () => void
  startWorkflow: () => void
  selectCandidate: (candidate: Candidate) => void
  submitAppointmentData: (nric: string, effectiveDate: string) => void
  sendConsent: () => void
  signConsent: () => void
  confirmApprovers: () => void
  sendResolution: () => void
  castVote: (approverId: string, vote: 'approved' | 'declined') => void
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, dispatch] = useReducer(reducer, undefined, buildInitialWorkflow)
  const [persp, dispatchPersp] = useReducer(perspectiveReducer, {
    active: 'sarah' as PersonaId,
    manualOverride: false,
  })

  const setPerspective = useCallback(
    (persona: PersonaId, manual = true) => {
      dispatchPersp(
        manual
          ? { type: 'MANUAL_SET', persona }
          : { type: 'AUTO_SET', persona },
      )
    },
    [],
  )

  const resetManualOverride = useCallback(() => {
    dispatchPersp({ type: 'AUTO_SET', persona: persp.active })
  }, [persp.active])

  const startWorkflow = useCallback(() => dispatch({ type: 'START_WORKFLOW' }), [])
  const selectCandidate = useCallback(
    (candidate: Candidate) => dispatch({ type: 'SELECT_CANDIDATE', candidate }),
    [],
  )
  const submitAppointmentData = useCallback(
    (nric: string, effectiveDate: string) =>
      dispatch({ type: 'SUBMIT_APPOINTMENT_DATA', nric, effectiveDate }),
    [],
  )
  const sendConsent = useCallback(() => dispatch({ type: 'SEND_CONSENT' }), [])
  const signConsent = useCallback(() => dispatch({ type: 'SIGN_CONSENT' }), [])
  const confirmApprovers = useCallback(
    () => dispatch({ type: 'CONFIRM_APPROVERS' }),
    [],
  )
  const sendResolution = useCallback(() => dispatch({ type: 'SEND_RESOLUTION' }), [])
  const castVote = useCallback(
    (approverId: string, vote: 'approved' | 'declined') =>
      dispatch({ type: 'CAST_VOTE', approverId, vote }),
    [],
  )

  // ── Perspective auto-handoffs ─────────────────────────────────────
  const consentSentRef = useRef(false)
  const consentSignedRef = useRef(false)
  const resolutionSentRef = useRef(false)
  const robertVotedRef = useRef(false)

  useEffect(() => {
    if (workflow.consentDocument.sent && !consentSentRef.current) {
      consentSentRef.current = true
      setPerspective('priya', false)
    }
  }, [workflow.consentDocument.sent, setPerspective])

  useEffect(() => {
    if (workflow.consentDocument.signedAt && !consentSignedRef.current) {
      consentSignedRef.current = true
      setPerspective('sarah', false)
    }
  }, [workflow.consentDocument.signedAt, setPerspective])

  useEffect(() => {
    if (workflow.boardResolution.sent && !resolutionSentRef.current) {
      resolutionSentRef.current = true
      // Hand off to Robert briefly so he can vote
      setPerspective('robert', false)
    }
  }, [workflow.boardResolution.sent, setPerspective])

  useEffect(() => {
    const robertVote = workflow.agentic.votes.find((v) => v.id === ROBERT_JOHNSON.id)
    if (robertVote?.status === 'approved' && !robertVotedRef.current) {
      robertVotedRef.current = true
      // After Robert votes, snap back to Sarah's view to watch the rest unfold
      setTimeout(() => setPerspective('sarah', false), 1200)
    }
  }, [workflow.agentic.votes, setPerspective])

  // ── Autonomous segment simulation ────────────────────────────────
  // After Robert votes, auto-approve the remaining three approvers, advance
  // to filing, run filing substeps, then run entity update substeps, then complete.
  // We read votes through a ref so subsequent CAST_VOTE re-renders don't tear
  // down the timeouts we just scheduled (the prior bug).
  const automationStartedRef = useRef(false)
  const votesRef = useRef(workflow.agentic.votes)
  useEffect(() => {
    votesRef.current = workflow.agentic.votes
  }, [workflow.agentic.votes])
  const robertApproved =
    workflow.agentic.votes.find((v) => v.id === ROBERT_JOHNSON.id)?.status ===
    'approved'
  useEffect(() => {
    if (!workflow.agentic.active || automationStartedRef.current) return
    if (!robertApproved) return
    automationStartedRef.current = true

    const timeouts: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timeouts.push(setTimeout(fn, ms))

    const remaining = votesRef.current.filter(
      (v) => v.id !== ROBERT_JOHNSON.id && v.status === 'pending',
    )
    remaining.forEach((v, idx) => {
      at(ROBERT_VOTE_AUTOMATION_DELAY_MS + idx * REMAINING_VOTES_INTERVAL_MS, () =>
        dispatch({ type: 'CAST_VOTE', approverId: v.id, vote: 'approved' }),
      )
    })

    const lastVoteAt =
      ROBERT_VOTE_AUTOMATION_DELAY_MS +
      Math.max(0, remaining.length - 1) * REMAINING_VOTES_INTERVAL_MS

    // Filing kicks off after the last vote
    at(lastVoteAt + 600, () => {
      dispatch({ type: 'ADVANCE_STEP', completed: 'board-approval', next: 'filing' })
      dispatch({ type: 'PROGRESS_FILING', index: 0, status: 'in_progress' })
    })
    at(lastVoteAt + 600 + FILING_STEP_INTERVAL_MS, () => {
      dispatch({ type: 'PROGRESS_FILING', index: 0, status: 'completed' })
      dispatch({ type: 'PROGRESS_FILING', index: 1, status: 'in_progress' })
    })
    at(lastVoteAt + 600 + FILING_STEP_INTERVAL_MS * 2, () => {
      dispatch({ type: 'PROGRESS_FILING', index: 1, status: 'completed' })
      dispatch({ type: 'PROGRESS_FILING', index: 2, status: 'in_progress' })
    })
    at(lastVoteAt + 600 + FILING_STEP_INTERVAL_MS * 3, () => {
      dispatch({ type: 'PROGRESS_FILING', index: 2, status: 'completed' })
      dispatch({ type: 'ADVANCE_STEP', completed: 'filing', next: 'update-entities' })
      dispatch({ type: 'PROGRESS_ENTITY', index: 0, status: 'in_progress' })
    })
    at(lastVoteAt + 600 + FILING_STEP_INTERVAL_MS * 3 + ENTITY_STEP_INTERVAL_MS, () => {
      dispatch({ type: 'PROGRESS_ENTITY', index: 0, status: 'completed' })
      dispatch({ type: 'PROGRESS_ENTITY', index: 1, status: 'in_progress' })
    })
    at(
      lastVoteAt + 600 + FILING_STEP_INTERVAL_MS * 3 + ENTITY_STEP_INTERVAL_MS * 2,
      () => {
        dispatch({ type: 'PROGRESS_ENTITY', index: 1, status: 'completed' })
        dispatch({ type: 'ADVANCE_STEP', completed: 'update-entities', next: null })
        dispatch({ type: 'COMPLETE_PROCESS' })
      },
    )

    return () => timeouts.forEach(clearTimeout)
  }, [workflow.agentic.active, robertApproved])

  const value = useMemo<WorkflowContextValue>(
    () => ({
      workflow,
      perspective: persp.active,
      setPerspective,
      resetManualOverride,
      startWorkflow,
      selectCandidate,
      submitAppointmentData,
      sendConsent,
      signConsent,
      confirmApprovers,
      sendResolution,
      castVote,
    }),
    [
      workflow,
      persp.active,
      setPerspective,
      resetManualOverride,
      startWorkflow,
      selectCandidate,
      submitAppointmentData,
      sendConsent,
      signConsent,
      confirmApprovers,
      sendResolution,
      castVote,
    ],
  )

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkflow() {
  const ctx = useContext(WorkflowContext)
  if (!ctx) throw new Error('useWorkflow must be used inside WorkflowProvider')
  return ctx
}
