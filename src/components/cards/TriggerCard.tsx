import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { ShiftsActivity24Regular } from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import { useWorkflow } from '../../workflow/WorkflowContext'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '12px' },
  framing: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: '20px',
    color: tokens.colorNeutralForeground1,
  },
  facts: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
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

export function TriggerCard() {
  const styles = useStyles()
  const { workflow, startWorkflow } = useWorkflow()
  const started = workflow.triggerAcknowledged
  const status: CardStatus = started ? 'resolved' : 'awaiting'

  return (
    <AdaptiveCard
      icon={<ShiftsActivity24Regular />}
      title="Director resignation detected"
      subtitle="Workday · Pacific Polymer Logistics Pte. Ltd."
      status={status}
      statusLabel={status === 'resolved' ? 'Workflow started' : 'Action needed'}
      body={
        <div className={styles.body}>
          <p className={styles.framing}>{workflow.trigger.framing}</p>
          <div className={styles.facts}>
            <span className={styles.factLabel}>Departing</span>
            <span className={styles.factValue}>
              {workflow.departingDirector?.name} · {workflow.departingDirector?.title}
            </span>
            <span className={styles.factLabel}>Last working day</span>
            <span className={styles.factValue}>May 17, 2026</span>
            <span className={styles.factLabel}>Filing deadline</span>
            <span className={styles.factValue}>
              {workflow.trigger.filingDeadline} · ACRA Form 45
            </span>
            <span className={styles.factLabel}>Jurisdiction</span>
            <span className={styles.factValue}>
              Singapore · Companies Act, Cap. 50 · local-director rule applies
            </span>
          </div>
        </div>
      }
      footer={
        status === 'awaiting' ? (
          <>
            <Button appearance="subtle">Snooze 24h</Button>
            <Button appearance="primary" onClick={startWorkflow}>
              Start the appointment
            </Button>
          </>
        ) : (
          <Button appearance="subtle" disabled>
            Workflow in progress
          </Button>
        )
      }
    />
  )
}
