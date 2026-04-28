import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { MessageRow } from './MessageRow'
import { TriggerCard } from './cards/TriggerCard'
import { CandidateShortlistCard } from './cards/CandidateShortlistCard'
import { CollectDataCard } from './cards/CollectDataCard'
import { ConsentToActCard } from './cards/ConsentToActCard'
import { ApproverConfigCard } from './cards/ApproverConfigCard'
import { VoteCard } from './cards/VoteCard'
import { AgenticProgressCard } from './cards/AgenticProgressCard'
import { SummaryCard } from './cards/SummaryCard'
import { AGENT_NAME, PERSONA_BY_ID, type PersonaId } from '../personas/personas'
import { useWorkflow } from '../workflow/WorkflowContext'
import {
  CloudArrowUp24Regular,
  DatabasePerson24Regular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  scroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 28px 12px',
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  dayDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    margin: '0 0 16px',
  },
  dayLine: { flex: 1, height: '1px', backgroundColor: tokens.colorNeutralStroke2 },
  emptyState: {
    margin: 'auto',
    maxWidth: '440px',
    padding: '32px 24px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
  },
  emptyTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '16px',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  emptyBody: {
    fontSize: '13px',
    lineHeight: '20px',
    color: tokens.colorNeutralForeground2,
  },
})

interface MessageSpec {
  key: string
  variant: 'bot' | 'user' | 'system'
  body: ReactNode
  timestamp: string
  bare?: boolean
}

const MIN = 60_000

function timeStr(offsetMin = 0) {
  const d = new Date(Date.now() - offsetMin * MIN)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function buildSarahMessages(
  workflow: ReturnType<typeof useWorkflow>['workflow'],
): MessageSpec[] {
  const msgs: MessageSpec[] = []
  const stepStatus = (id: string) =>
    workflow.steps.find((s) => s.id === id)?.status ?? 'not_started'
  const triggerAcked = workflow.triggerAcknowledged
  const candidateChosen = workflow.selectedCandidate !== null
  const dataSubmitted = workflow.appointmentNric !== null
  const consentSent = workflow.consentDocument.sent
  const consentSigned = workflow.consentDocument.signedAt !== null
  const approversConfirmed = workflow.approvers.confirmed
  const resolutionSent = workflow.boardResolution.sent
  const filingStarted = stepStatus('filing') !== 'not_started'
  const filingDone = stepStatus('filing') === 'completed'
  const entityStarted = stepStatus('update-entities') !== 'not_started'
  const entityDone = stepStatus('update-entities') === 'completed'
  const allDone = workflow.agentic.processComplete

  // --- Step 0: Trigger
  msgs.push({
    key: 'sarah-greeting',
    variant: 'bot',
    timestamp: timeStr(28),
    body: (
      <>
        Good morning, Sarah. I&apos;m the Diligent Governance Agent. Workday just
        flagged a director resignation that needs corporate-secretary attention
        — taking the lead so you can review and decide.
      </>
    ),
  })
  msgs.push({
    key: 'sarah-trigger-card',
    variant: 'bot',
    timestamp: timeStr(28),
    bare: true,
    body: <TriggerCard />,
  })

  if (!triggerAcked) return msgs

  msgs.push({
    key: 'sarah-start-reply',
    variant: 'user',
    timestamp: timeStr(26),
    body: <>Yes, let&apos;s get started.</>,
  })

  // --- Step 1: Candidate shortlist
  msgs.push({
    key: 'sarah-candidates-msg',
    variant: 'bot',
    timestamp: timeStr(25),
    body: (
      <>
        I queried Workday for eligible directors and ran them through the
        Singapore Companies Act criteria — the local-resident rule applies for
        Pacific Polymer. Three candidates passed; Priya Nair is the strongest
        match.
      </>
    ),
  })
  msgs.push({
    key: 'sarah-candidates-card',
    variant: 'bot',
    timestamp: timeStr(25),
    bare: true,
    body: <CandidateShortlistCard />,
  })

  if (!candidateChosen) return msgs

  msgs.push({
    key: 'sarah-candidate-reply',
    variant: 'user',
    timestamp: timeStr(23),
    body: <>Let&apos;s go with {workflow.selectedCandidate?.name}.</>,
  })

  // --- Step 2a: Collect data
  msgs.push({
    key: 'sarah-collect-msg',
    variant: 'bot',
    timestamp: timeStr(22),
    body: (
      <>
        Great. To prepare the Consent to Act and the ACRA Form 45, I need
        NRIC and the effective date. I&apos;ve prefilled what we have on
        file — just confirm or correct.
      </>
    ),
  })
  msgs.push({
    key: 'sarah-collect-card',
    variant: 'bot',
    timestamp: timeStr(22),
    bare: true,
    body: <CollectDataCard />,
  })

  if (!dataSubmitted) return msgs

  msgs.push({
    key: 'sarah-collect-reply',
    variant: 'user',
    timestamp: timeStr(20),
    body: <>Confirmed.</>,
  })

  // --- Step 2b: Consent (Sarah's view: review + send)
  msgs.push({
    key: 'sarah-consent-msg',
    variant: 'bot',
    timestamp: timeStr(19),
    body: (
      <>
        Here&apos;s the draft Consent to Act. Review and I&apos;ll send it to{' '}
        {workflow.selectedCandidate?.name?.split(' ')[0]} for signature.
      </>
    ),
  })
  msgs.push({
    key: 'sarah-consent-card',
    variant: 'bot',
    timestamp: timeStr(19),
    bare: true,
    body: <ConsentToActCard audience="sarah" />,
  })

  if (consentSent && !consentSigned) {
    msgs.push({
      key: 'sarah-consent-sent-reply',
      variant: 'user',
      timestamp: timeStr(17),
      body: <>Send it.</>,
    })
    msgs.push({
      key: 'sarah-consent-waiting',
      variant: 'bot',
      timestamp: timeStr(17),
      body: (
        <>
          Sent to {workflow.selectedCandidate?.name?.split(' ')[0]}. I&apos;ll
          ping you the moment it&apos;s signed and returned.
        </>
      ),
    })
  }

  if (consentSigned) {
    msgs.push({
      key: 'sarah-consent-sent-reply',
      variant: 'user',
      timestamp: timeStr(17),
      body: <>Send it.</>,
    })
    msgs.push({
      key: 'sarah-consent-signed',
      variant: 'bot',
      timestamp: timeStr(15),
      body: (
        <>
          {workflow.selectedCandidate?.name?.split(' ')[0]} just signed the
          Consent to Act. Moving on to approvers.
        </>
      ),
    })
  }

  if (!consentSigned) return msgs

  // --- Step 3: Approver config + resolution
  msgs.push({
    key: 'sarah-approvers-msg',
    variant: 'bot',
    timestamp: timeStr(14),
    body: (
      <>
        I pre-populated the Nominating &amp; Governance committee plus our
        sitting CEO and two independents — that meets the bylaw quorum for an
        APAC director appointment. Confirm the list and I&apos;ll send the
        resolution.
      </>
    ),
  })
  msgs.push({
    key: 'sarah-approvers-card',
    variant: 'bot',
    timestamp: timeStr(14),
    bare: true,
    body: <ApproverConfigCard />,
  })

  if (approversConfirmed && !resolutionSent) {
    msgs.push({
      key: 'sarah-approvers-confirmed',
      variant: 'user',
      timestamp: timeStr(12),
      body: <>Approver list looks right.</>,
    })
  }

  if (!resolutionSent) return msgs

  msgs.push({
    key: 'sarah-approvers-confirmed',
    variant: 'user',
    timestamp: timeStr(12),
    body: <>Confirmed — send it.</>,
  })

  // --- Step 4: Vote tally
  msgs.push({
    key: 'sarah-vote-msg',
    variant: 'bot',
    timestamp: timeStr(11),
    body: (
      <>
        Resolution dispatched to the four approvers. I&apos;ll surface each vote
        here as it comes in — tap the tally below for live status.
      </>
    ),
  })
  msgs.push({
    key: 'sarah-vote-card',
    variant: 'bot',
    timestamp: timeStr(11),
    bare: true,
    body: <VoteCard audience="sarah" />,
  })

  // --- Step 5: Filing
  if (filingStarted) {
    msgs.push({
      key: 'sarah-filing-msg',
      variant: 'bot',
      timestamp: timeStr(7),
      body: (
        <>
          Resolution approved unanimously. Filing the regulatory documents with
          ACRA via BizFile+ now — no further input needed from you.
        </>
      ),
    })
    msgs.push({
      key: 'sarah-filing-card',
      variant: 'bot',
      timestamp: timeStr(7),
      bare: true,
      body: (
        <AgenticProgressCard
          icon={<CloudArrowUp24Regular />}
          title="Filing with ACRA"
          subtitle="BizFile+ · Form 45 — Notification of Change of Director"
          substeps={workflow.agentic.filingSubsteps}
        />
      ),
    })
  }

  // --- Step 6: Entity records
  if (entityStarted) {
    msgs.push({
      key: 'sarah-entity-msg',
      variant: 'bot',
      timestamp: timeStr(filingDone ? 4 : 5),
      body: (
        <>
          Filing accepted by ACRA. Updating Acme&apos;s entity register so
          downstream systems see the change.
        </>
      ),
    })
    msgs.push({
      key: 'sarah-entity-card',
      variant: 'bot',
      timestamp: timeStr(filingDone ? 4 : 5),
      bare: true,
      body: (
        <AgenticProgressCard
          icon={<DatabasePerson24Regular />}
          title="Updating entity records"
          subtitle="Acme entity register · resignation + appointment"
          substeps={workflow.agentic.entitySubsteps}
        />
      ),
    })
  }

  if (allDone) {
    msgs.push({
      key: 'sarah-summary-msg',
      variant: 'bot',
      timestamp: timeStr(1),
      body: (
        <>
          {workflow.selectedCandidate?.name} is now the director of record at{' '}
          {workflow.entity.name}. Full audit trail is attached.
        </>
      ),
    })
    msgs.push({
      key: 'sarah-summary-card',
      variant: 'bot',
      timestamp: timeStr(0),
      bare: true,
      body: <SummaryCard />,
    })
  }

  if (!entityDone && filingDone) {
    // No-op: the entity card shows progress
  }

  return msgs
}

function buildPriyaMessages(
  workflow: ReturnType<typeof useWorkflow>['workflow'],
): MessageSpec[] {
  const msgs: MessageSpec[] = []
  const sent = workflow.consentDocument.sent
  const signed = workflow.consentDocument.signedAt !== null

  if (!sent) {
    return msgs // empty-state will render
  }

  msgs.push({
    key: 'priya-intro',
    variant: 'bot',
    timestamp: timeStr(17),
    body: (
      <>
        Hi Priya — Sarah Chen (Acme Corporate Secretary) has selected you to
        replace David Chen as director of Pacific Polymer Logistics Pte. Ltd.,
        effective {workflow.appointmentEffectiveDate}. Singapore law requires
        your written consent before the appointment can proceed. The form below
        is pre-filled — review and sign when you&apos;re ready.
      </>
    ),
  })
  msgs.push({
    key: 'priya-consent-card',
    variant: 'bot',
    timestamp: timeStr(17),
    bare: true,
    body: <ConsentToActCard audience="priya" />,
  })

  if (signed) {
    msgs.push({
      key: 'priya-sign-reply',
      variant: 'user',
      timestamp: timeStr(15),
      body: <>Signed.</>,
    })
    msgs.push({
      key: 'priya-thanks',
      variant: 'bot',
      timestamp: timeStr(15),
      body: (
        <>
          Thanks, Priya. Your consent is on file. The Acme board will vote on
          the appointing resolution next; I&apos;ll let you know when it&apos;s
          confirmed.
        </>
      ),
    })
  }

  return msgs
}

function buildRobertMessages(
  workflow: ReturnType<typeof useWorkflow>['workflow'],
): MessageSpec[] {
  const msgs: MessageSpec[] = []
  const sent = workflow.boardResolution.sent
  const robertVote = workflow.agentic.votes.find((v) => v.id === 'robert-johnson')
  const voted = robertVote?.status === 'approved'

  if (!sent) {
    return msgs
  }

  msgs.push({
    key: 'robert-intro',
    variant: 'bot',
    timestamp: timeStr(11),
    body: (
      <>
        Hi Robert — as Nominating &amp; Governance committee chair, your vote is
        needed on a director-appointment resolution at Pacific Polymer Logistics
        Pte. Ltd. The candidate ({workflow.selectedCandidate?.name}) has signed
        her Consent to Act. Resolution attached for review.
      </>
    ),
  })
  msgs.push({
    key: 'robert-vote-card',
    variant: 'bot',
    timestamp: timeStr(11),
    bare: true,
    body: <VoteCard audience="robert" />,
  })

  if (voted) {
    msgs.push({
      key: 'robert-vote-reply',
      variant: 'user',
      timestamp: timeStr(9),
      body: <>Approve.</>,
    })
    msgs.push({
      key: 'robert-thanks',
      variant: 'bot',
      timestamp: timeStr(9),
      body: (
        <>
          Vote recorded. Thanks, Robert. I&apos;ll close the loop with you and
          the rest of the board once filing with ACRA is complete.
        </>
      ),
    })
  }

  return msgs
}

function EmptyState({ persona }: { persona: PersonaId }) {
  const styles = useStyles()
  const p = PERSONA_BY_ID[persona]
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>
        Hi {p.shortLabel}, I&apos;m the {AGENT_NAME}
      </div>
      <div className={styles.emptyBody}>
        I route board-governance work into Teams when it needs your attention —
        signing forms, voting on resolutions, reviewing audit trails. No new
        requests right now. I&apos;ll send a message here when you&apos;re
        needed.
      </div>
    </div>
  )
}

interface ChatThreadProps {
  persona: PersonaId
}

export function ChatThread({ persona }: ChatThreadProps) {
  const styles = useStyles()
  const { workflow } = useWorkflow()
  const ref = useRef<HTMLDivElement>(null)

  const messages = useMemo(() => {
    if (persona === 'sarah') return buildSarahMessages(workflow)
    if (persona === 'priya') return buildPriyaMessages(workflow)
    return buildRobertMessages(workflow)
  }, [persona, workflow])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, persona])

  if (messages.length === 0) {
    return (
      <div className={styles.scroll} ref={ref}>
        <EmptyState persona={persona} />
      </div>
    )
  }

  return (
    <div className={styles.scroll} ref={ref}>
      <div className={styles.dayDivider}>
        <span className={styles.dayLine} />
        <span>Today</span>
        <span className={styles.dayLine} />
      </div>
      {messages.map((m) => {
        if (m.variant === 'bot') {
          return (
            <MessageRow
              key={m.key}
              variant="bot"
              name={AGENT_NAME}
              timestamp={m.timestamp}
              appBadge
              bare={m.bare}
            >
              {m.body}
            </MessageRow>
          )
        }
        if (m.variant === 'user') {
          const p = PERSONA_BY_ID[persona]
          return (
            <MessageRow
              key={m.key}
              variant="user"
              name="You"
              initials={p.initials}
              avatarColor={p.avatarColor}
              timestamp={m.timestamp}
            >
              {m.body}
            </MessageRow>
          )
        }
        return (
          <MessageRow
            key={m.key}
            variant="system"
            name="System"
            timestamp={m.timestamp}
          >
            {m.body}
          </MessageRow>
        )
      })}
    </div>
  )
}
