import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  CheckmarkCircle20Filled,
  DocumentSignature24Regular,
} from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import { useWorkflow } from '../../workflow/WorkflowContext'
import { FileChip } from '../FileChip'
import { selectDocuments } from '../../workflow/documents'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '12px' },
  meta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
  signed: {
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

interface ConsentToActCardProps {
  /** 'sarah' shows "Send for signature"; 'priya' shows "Sign and submit". */
  audience: 'sarah' | 'priya'
}

export function ConsentToActCard({ audience }: ConsentToActCardProps) {
  const styles = useStyles()
  const { workflow, sendConsent, signConsent } = useWorkflow()
  const sent = workflow.consentDocument.sent
  const signed = workflow.consentDocument.signedAt !== null
  const consentDoc = selectDocuments(workflow).find((d) => d.id === 'doc-form-45')

  let status: CardStatus = 'awaiting'
  let statusLabel = audience === 'sarah' ? 'Ready to send' : 'Action needed'
  if (signed) {
    status = 'resolved'
    statusLabel = 'Signed'
  } else if (sent && audience === 'sarah') {
    status = 'running'
    statusLabel = 'Sent · awaiting signature'
  } else if (sent && audience === 'priya') {
    status = 'awaiting'
    statusLabel = 'Awaiting your signature'
  }

  return (
    <AdaptiveCard
      icon={<DocumentSignature24Regular />}
      title="Form 45 — Consent to Act as Director"
      subtitle="Companies Act s.145(5) · Singapore"
      status={status}
      statusLabel={statusLabel}
      body={
        <div className={styles.body}>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              Appointee: <strong>{workflow.selectedCandidate?.name}</strong>
            </span>
            <span className={styles.metaItem}>
              NRIC: <strong>{workflow.appointmentNric ?? '—'}</strong>
            </span>
            <span className={styles.metaItem}>
              Effective: <strong>{workflow.appointmentEffectiveDate ?? '—'}</strong>
            </span>
          </div>
          {consentDoc && <FileChip doc={consentDoc} />}
          {signed && (
            <span className={mergeClasses(styles.signed)}>
              <CheckmarkCircle20Filled />
              Signed and returned ·{' '}
              {new Date(workflow.consentDocument.signedAt!).toLocaleString('en-US', {
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
        audience === 'sarah' ? (
          sent ? (
            <Button appearance="subtle" disabled>
              {signed ? 'Completed' : 'Sent to appointee'}
            </Button>
          ) : (
            <>
              <Button appearance="subtle">Edit document</Button>
              <Button appearance="primary" onClick={sendConsent}>
                Send to {workflow.selectedCandidate?.name?.split(' ')[0] ?? 'appointee'}
              </Button>
            </>
          )
        ) : signed ? (
          <Button appearance="subtle" disabled>
            Submitted
          </Button>
        ) : (
          <>
            <Button appearance="subtle">Decline</Button>
            <Button appearance="primary" onClick={signConsent}>
              Sign and submit
            </Button>
          </>
        )
      }
    />
  )
}
