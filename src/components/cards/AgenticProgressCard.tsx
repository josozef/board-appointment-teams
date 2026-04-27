import { makeStyles, mergeClasses, ProgressBar, tokens } from '@fluentui/react-components'
import {
  ArrowSync20Regular,
  CheckmarkCircle20Filled,
  Circle20Regular,
} from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import type { AgenticSubstep } from '../../workflow/types'

const useStyles = makeStyles({
  body: { display: 'flex', flexDirection: 'column', gap: '12px' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    fontSize: '13px',
  },
  rowDone: { backgroundColor: '#F1FAF4', border: '1px solid #9CD8B5' },
  rowRunning: { backgroundColor: '#FFFAEA', border: '1px solid #F0D38E' },
  name: { flex: 1, color: tokens.colorNeutralForeground1 },
  status: {
    fontSize: '12px',
    fontWeight: tokens.fontWeightSemibold,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  done: { color: '#0F5132' },
  running: { color: '#5C3A00' },
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

interface AgenticProgressCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  substeps: AgenticSubstep[]
}

export function AgenticProgressCard({
  icon,
  title,
  subtitle,
  substeps,
}: AgenticProgressCardProps) {
  const styles = useStyles()
  const completed = substeps.filter((s) => s.status === 'completed').length
  const total = substeps.length
  const isRunning = substeps.some((s) => s.status === 'in_progress')

  let status: CardStatus = 'awaiting'
  let statusLabel = 'Queued'
  if (completed === total) {
    status = 'resolved'
    statusLabel = 'Complete'
  } else if (isRunning || completed > 0) {
    status = 'running'
    statusLabel = `${completed} of ${total}`
  }

  return (
    <AdaptiveCard
      icon={icon}
      title={title}
      subtitle={subtitle}
      status={status}
      statusLabel={statusLabel}
      body={
        <div className={styles.body}>
          <div className={styles.tally}>
            <span>
              Progress{' '}
              <span className={styles.tallyValue}>
                {completed}/{total}
              </span>
            </span>
            <span className={styles.progressWrap}>
              <ProgressBar
                value={total ? completed / total : 0}
                thickness="medium"
              />
            </span>
            <span className={styles.tallyValue}>
              {Math.round((completed / total) * 100)}%
            </span>
          </div>
          <div className={styles.list}>
            {substeps.map((s, i) => {
              const done = s.status === 'completed'
              const running = s.status === 'in_progress'
              return (
                <div
                  key={i}
                  className={mergeClasses(
                    styles.row,
                    done && styles.rowDone,
                    running && styles.rowRunning,
                  )}
                >
                  <span className={styles.name}>{s.name}</span>
                  <span
                    className={mergeClasses(
                      styles.status,
                      done && styles.done,
                      running && styles.running,
                      !done && !running && styles.pending,
                    )}
                  >
                    {done ? (
                      <>
                        <CheckmarkCircle20Filled />
                        Done {s.time && `· ${s.time}`}
                      </>
                    ) : running ? (
                      <>
                        <ArrowSync20Regular />
                        Running…
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
        </div>
      }
    />
  )
}
