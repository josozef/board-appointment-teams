import {
  Button,
  makeStyles,
  mergeClasses,
  ProgressBar,
  tokens,
} from '@fluentui/react-components'
import {
  CheckmarkCircle20Filled,
  Circle20Regular,
  CircleHalfFill20Regular,
  GavelRegular,
} from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import { Avatar } from '../Avatar'
import { FileChip } from '../FileChip'
import { useWorkflow } from '../../workflow/WorkflowContext'
import { selectDocuments } from '../../workflow/documents'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '14px' },
  voteList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  voteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    backgroundColor: '#ffffff',
  },
  voteRowApproved: {
    border: '1px solid #9CD8B5',
    backgroundColor: '#F1FAF4',
  },
  voterInfo: { flex: 1, minWidth: 0 },
  voterName: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  voterMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  voteStatus: {
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  approved: { color: '#0F5132' },
  pending: { color: tokens.colorNeutralForeground3 },
  tally: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  tallyValue: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  progressWrap: { flex: 1, minWidth: '120px' },
})

interface VoteCardProps {
  /** Robert sees an actionable vote card; Sarah sees a live tally. */
  audience: 'robert' | 'sarah'
}

export function VoteCard({ audience }: VoteCardProps) {
  const styles = useStyles()
  const { workflow, castVote } = useWorkflow()
  const resolutionDoc = selectDocuments(workflow).find(
    (d) => d.id === 'doc-board-resolution',
  )
  const leadVote = workflow.agentic.votes[0]
  const leadVoted = leadVote?.status === 'approved'
  const approvedCount = workflow.agentic.votes.filter(
    (v) => v.status === 'approved',
  ).length
  const total = workflow.agentic.votes.length
  const allApproved = approvedCount === total

  let status: CardStatus = 'awaiting'
  let statusLabel = audience === 'robert' ? 'Action needed' : 'Awaiting votes'
  if (audience === 'robert') {
    if (leadVoted) {
      status = 'resolved'
      statusLabel = 'Vote recorded'
    }
  } else {
    if (allApproved) {
      status = 'resolved'
      statusLabel = 'Approved unanimously'
    } else if (approvedCount > 0) {
      status = 'running'
      statusLabel = `${approvedCount} of ${total} approved`
    }
  }

  return (
    <AdaptiveCard
      icon={<GavelRegular fontSize={20} />}
      title="Board Resolution — Director appointment"
      subtitle={`${workflow.entity.name}`}
      status={status}
      statusLabel={statusLabel}
      body={
        <div className={styles.body}>
          {resolutionDoc && <FileChip doc={resolutionDoc} />}
          {audience === 'sarah' && (
            <>
              <div className={styles.tally}>
                <span>
                  Votes <span className={styles.tallyValue}>{approvedCount}/{total}</span>
                </span>
                <span className={styles.progressWrap}>
                  <ProgressBar value={approvedCount / total} thickness="medium" />
                </span>
                <span className={styles.tallyValue}>
                  {Math.round((approvedCount / total) * 100)}%
                </span>
              </div>
              <div className={styles.voteList}>
                {workflow.agentic.votes.map((v) => {
                  const approved = v.status === 'approved'
                  const initials = v.name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  return (
                    <div
                      key={v.id}
                      className={mergeClasses(
                        styles.voteRow,
                        approved && styles.voteRowApproved,
                      )}
                    >
                      <Avatar
                        kind="person"
                        initials={initials}
                        color="#5C2E91"
                        size={28}
                      />
                      <div className={styles.voterInfo}>
                        <div className={styles.voterName}>{v.name}</div>
                        <div className={styles.voterMeta}>{v.title}</div>
                      </div>
                      <span
                        className={mergeClasses(
                          styles.voteStatus,
                          approved ? styles.approved : styles.pending,
                        )}
                      >
                        {approved ? (
                          <>
                            <CheckmarkCircle20Filled />
                            Approved {v.time && `· ${v.time}`}
                          </>
                        ) : v.id === leadVote?.id ? (
                          <>
                            <CircleHalfFill20Regular />
                            Awaiting lead approver
                          </>
                        ) : (
                          <>
                            <Circle20Regular />
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      }
      footer={
        audience === 'robert' ? (
          leadVoted ? (
            <Button appearance="subtle" disabled>
              You approved at {leadVote?.time}
            </Button>
          ) : leadVote ? (
            <>
              <Button appearance="subtle">Request changes</Button>
              <Button
                appearance="primary"
                onClick={() => castVote(leadVote.id, 'approved')}
              >
                Approve resolution
              </Button>
            </>
          ) : (
            <Button appearance="subtle" disabled>
              No approvers selected
            </Button>
          )
        ) : null
      }
    />
  )
}
