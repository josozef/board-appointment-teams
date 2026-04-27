import {
  Button,
  Checkbox,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  CheckmarkCircle20Filled,
  GavelRegular,
} from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import { Avatar } from '../Avatar'
import { FileChip } from '../FileChip'
import { useWorkflow } from '../../workflow/WorkflowContext'
import { selectDocuments } from '../../workflow/documents'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '14px' },
  approverList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  approverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    backgroundColor: '#ffffff',
  },
  approverInfo: { flex: 1, minWidth: 0 },
  approverName: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  approverMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  resolutionLabel: {
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  bannerSent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#0F5132',
    backgroundColor: '#DDF6E6',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    width: 'fit-content',
  },
})

export function ApproverConfigCard() {
  const styles = useStyles()
  const { workflow, confirmApprovers, sendResolution } = useWorkflow()
  const confirmed = workflow.approvers.confirmed
  const sent = workflow.boardResolution.sent
  const resolutionDoc = selectDocuments(workflow).find(
    (d) => d.id === 'doc-board-resolution',
  )

  let status: CardStatus = 'awaiting'
  let statusLabel = 'Confirm approvers'
  if (sent) {
    status = 'resolved'
    statusLabel = 'Resolution sent'
  } else if (confirmed) {
    status = 'running'
    statusLabel = 'Resolution drafted'
  }

  return (
    <AdaptiveCard
      icon={<GavelRegular fontSize={20} />}
      title="Configure approvers & draft Board Resolution"
      subtitle="Acme · Nominating & Governance Committee"
      status={status}
      statusLabel={statusLabel}
      body={
        <div className={styles.body}>
          <div className={styles.approverList}>
            {workflow.approvers.selected.map((a) => (
              <div key={a.id} className={styles.approverRow}>
                <Checkbox checked disabled />
                <Avatar
                  kind="person"
                  initials={a.initials}
                  color="#5C2E91"
                  size={28}
                />
                <div className={styles.approverInfo}>
                  <div className={styles.approverName}>{a.name}</div>
                  <div className={styles.approverMeta}>
                    {a.title} · {a.fromCommittee} Committee
                  </div>
                </div>
              </div>
            ))}
          </div>

          <span className={styles.resolutionLabel}>Board Resolution</span>
          {resolutionDoc && <FileChip doc={resolutionDoc} />}

          {sent && (
            <span className={styles.bannerSent}>
              <CheckmarkCircle20Filled />
              Resolution sent to {workflow.approvers.selected.length} approvers ·{' '}
              {new Date(workflow.boardResolution.sentAt!).toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      }
      footer={
        sent ? (
          <Button appearance="subtle" disabled>
            Sent
          </Button>
        ) : confirmed ? (
          <>
            <Button appearance="subtle">Edit resolution</Button>
            <Button appearance="primary" onClick={sendResolution}>
              Send for signature
            </Button>
          </>
        ) : (
          <>
            <Button appearance="subtle">Add approver</Button>
            <Button appearance="primary" onClick={confirmApprovers}>
              Confirm approvers
            </Button>
          </>
        )
      }
    />
  )
}
