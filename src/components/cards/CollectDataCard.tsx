import { useState } from 'react'
import {
  Button,
  Field,
  Input,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { ClipboardTextEdit24Regular } from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import { useWorkflow } from '../../workflow/WorkflowContext'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '14px' },
  preamble: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '18px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px 14px',
  },
  resolvedFacts: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    rowGap: '6px',
    columnGap: '12px',
    fontSize: '13px',
  },
  factLabel: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  factValue: { color: tokens.colorNeutralForeground1 },
})

export function CollectDataCard() {
  const styles = useStyles()
  const { workflow, submitAppointmentData } = useWorkflow()
  const candidate = workflow.selectedCandidate
  const submitted = workflow.appointmentNric !== null
  const [nric, setNric] = useState('S8042157C')
  const [effectiveDate, setEffectiveDate] = useState('2026-05-18')
  const status: CardStatus = submitted ? 'resolved' : 'awaiting'

  return (
    <AdaptiveCard
      icon={<ClipboardTextEdit24Regular />}
      title="Collect appointment data"
      subtitle="Required by ACRA Form 45 · Companies Act s.173(6)"
      status={status}
      statusLabel={submitted ? 'Captured' : 'Confirm details'}
      body={
        submitted ? (
          <div className={styles.resolvedFacts}>
            <span className={styles.factLabel}>Appointee</span>
            <span className={styles.factValue}>
              {candidate?.name} · {candidate?.title}
            </span>
            <span className={styles.factLabel}>NRIC</span>
            <span className={styles.factValue}>{workflow.appointmentNric}</span>
            <span className={styles.factLabel}>Effective date</span>
            <span className={styles.factValue}>
              {workflow.appointmentEffectiveDate}
            </span>
            <span className={styles.factLabel}>Entity</span>
            <span className={styles.factValue}>
              {workflow.entity.name} · UEN {workflow.entity.uen}
            </span>
          </div>
        ) : (
          <div className={styles.body}>
            <p className={styles.preamble}>
              I&apos;ve pre-filled what Workday and the entity register know about{' '}
              <strong>{candidate?.name}</strong>. Confirm or correct the two
              fields below and I&apos;ll draft the consent document next.
            </p>
            <div className={styles.grid}>
              <Field label="NRIC" required>
                <Input
                  value={nric}
                  onChange={(_, d) => setNric(d.value)}
                  placeholder="e.g. S1234567A"
                />
              </Field>
              <Field label="Effective date" required>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(_, d) => setEffectiveDate(d.value)}
                />
              </Field>
            </div>
          </div>
        )
      }
      footer={
        submitted ? (
          <Button appearance="subtle" disabled>
            Captured
          </Button>
        ) : (
          <>
            <Button appearance="subtle">Edit later</Button>
            <Button
              appearance="primary"
              disabled={!nric || !effectiveDate}
              onClick={() => submitAppointmentData(nric, effectiveDate)}
            >
              Confirm and continue
            </Button>
          </>
        )
      }
    />
  )
}
