import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  CheckmarkCircle20Filled,
  PeopleSearch24Regular,
  Star20Filled,
  Warning20Regular,
} from '@fluentui/react-icons'
import { AdaptiveCard, type CardStatus } from './AdaptiveCard'
import { Avatar } from '../Avatar'
import { useWorkflow } from '../../workflow/WorkflowContext'
import type { Candidate } from '../../workflow/types'

const useStyles = makeStyles({
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#ffffff',
  },
  rowRecommended: {
    border: '1px solid #5C2E91',
    backgroundColor: '#FAF8FF',
  },
  rowSelected: {
    border: '1px solid #0E7C42',
    backgroundColor: '#F1FAF4',
  },
  body: { flex: 1, minWidth: 0 },
  topLine: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    flexWrap: 'wrap',
  },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  title: { fontSize: '12px', color: tokens.colorNeutralForeground3 },
  matchPill: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    padding: '2px 8px',
    borderRadius: '999px',
    backgroundColor: '#E8EBFA',
    color: '#3D3F8C',
  },
  recPill: {
    fontSize: '10px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: '#5C2E91',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  notes: {
    fontSize: '12px',
    lineHeight: '18px',
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  notesWarn: { color: '#A33B00' },
  actionCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  selectedTag: {
    color: '#0E7C42',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
})

export function CandidateShortlistCard() {
  const styles = useStyles()
  const { workflow, selectCandidate } = useWorkflow()
  const selected = workflow.selectedCandidate
  const status: CardStatus = selected ? 'resolved' : 'awaiting'

  const renderRow = (c: Candidate) => {
    const isSelected = selected?.id === c.id
    const initials = c.name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    return (
      <div
        key={c.id}
        className={mergeClasses(
          styles.row,
          c.recommended && !selected && styles.rowRecommended,
          isSelected && styles.rowSelected,
        )}
      >
        <Avatar kind="person" initials={initials} color="#7B53D6" size={32} />
        <div className={styles.body}>
          <div className={styles.topLine}>
            <span className={styles.name}>{c.name}</span>
            <span className={styles.matchPill}>{c.matchPct}% match</span>
            {c.recommended && (
              <span className={styles.recPill}>
                <Star20Filled style={{ width: 12, height: 12 }} />
                Recommended
              </span>
            )}
          </div>
          <div className={styles.title}>{c.title}</div>
          <div
            className={mergeClasses(styles.notes, !c.resident && styles.notesWarn)}
          >
            {c.resident ? (
              <CheckmarkCircle20Filled
                style={{ width: 14, height: 14, color: '#0E7C42' }}
              />
            ) : (
              <Warning20Regular
                style={{ width: 14, height: 14, color: '#A33B00' }}
              />
            )}
            <span>{c.notes}</span>
          </div>
        </div>
        <div className={styles.actionCol}>
          {selected ? (
            isSelected ? (
              <span className={styles.selectedTag}>
                <CheckmarkCircle20Filled style={{ width: 14, height: 14 }} />
                Selected
              </span>
            ) : (
              <Button appearance="subtle" disabled>
                Not selected
              </Button>
            )
          ) : (
            <Button
              appearance={c.recommended ? 'primary' : 'secondary'}
              onClick={() => selectCandidate(c)}
            >
              Select
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <AdaptiveCard
      icon={<PeopleSearch24Regular />}
      title="Candidate shortlist"
      subtitle="Workday · Singapore Companies Act eligibility filter"
      status={status}
      statusLabel={status === 'resolved' ? 'Selected' : 'Pick one'}
      body={
        <div className={styles.list}>
          {workflow.candidatePool.map((c) => renderRow(c))}
        </div>
      }
    />
  )
}
