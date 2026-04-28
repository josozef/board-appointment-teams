import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { CheckmarkCircle24Filled } from '@fluentui/react-icons'
import { AdaptiveCard } from './AdaptiveCard'
import { FileChip } from '../FileChip'
import { useWorkflow } from '../../workflow/WorkflowContext'
import { selectDocuments } from '../../workflow/documents'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '14px' },
  hero: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#0F5132',
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
  },
  facts: {
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
  artifacts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  artifactsLabel: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
})

export function SummaryCard() {
  const styles = useStyles()
  const { workflow } = useWorkflow()
  const docs = selectDocuments(workflow)
  return (
    <AdaptiveCard
      icon={<CheckmarkCircle24Filled />}
      title="Appointment complete"
      subtitle="All six steps resolved · audit trail captured"
      status="resolved"
      statusLabel="Done"
      body={
        <div className={styles.body}>
          <div className={styles.hero}>
            <CheckmarkCircle24Filled style={{ color: '#0F5132' }} />
            {workflow.selectedCandidate?.name} appointed to {workflow.entity.name}
          </div>
          <div className={styles.facts}>
            <span className={styles.factLabel}>Effective date</span>
            <span className={styles.factValue}>
              {workflow.appointmentEffectiveDate}
            </span>
            <span className={styles.factLabel}>Replaces</span>
            <span className={styles.factValue}>
              {workflow.departingDirector?.name}
            </span>
            <span className={styles.factLabel}>Filed with</span>
            <span className={styles.factValue}>
              ACRA · Form 45 · BizFile+ confirmation received
            </span>
            <span className={styles.factLabel}>Approved by</span>
            <span className={styles.factValue}>
              4 of 4 directors · unanimous
            </span>
            <span className={styles.factLabel}>Entity register</span>
            <span className={styles.factValue}>
              Resignation + appointment recorded
            </span>
          </div>
          <div className={styles.artifacts}>
            <span className={styles.artifactsLabel}>Documents on file</span>
            {docs.map((d) => (
              <FileChip key={d.id} doc={d} />
            ))}
          </div>
        </div>
      }
      footer={
        <>
          <Button appearance="subtle">View audit log</Button>
          <Button appearance="primary">Open entity record</Button>
        </>
      }
    />
  )
}
