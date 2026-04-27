/**
 * Files tab content for the chat. Mirrors the Teams Files tab pattern:
 * a sortable list of attached documents with type icon, modified-by, size,
 * and quick actions. Click a row to open the file in its native app
 * (simulated via a styled HTML preview).
 */
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  ArrowSortRegular,
  CloudArrowUp24Regular,
  Filter24Regular,
} from '@fluentui/react-icons'
import { selectDocuments } from '../workflow/documents'
import { useWorkflow } from '../workflow/WorkflowContext'
import { FileChip } from './FileChip'

const useStyles = makeStyles({
  pane: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#ffffff',
    flexShrink: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: '13px',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground2,
    ':hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
  },
  toolbarTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontSize: '14px',
  },
  spacer: { flex: 1 },
  hint: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 24px 24px',
    gap: '8px',
  },
  empty: {
    margin: 'auto',
    maxWidth: '420px',
    padding: '40px 24px',
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
  },
  legendRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 200px 110px 80px',
    gap: '12px',
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    margin: '0 24px',
  },
  legendCell: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
})

export function FilesPane() {
  const styles = useStyles()
  const { workflow } = useWorkflow()
  const docs = selectDocuments(workflow)

  return (
    <section className={styles.pane} aria-label="Files">
      <div className={styles.toolbar}>
        <button type="button" className={styles.iconBtn} title="Upload">
          <CloudArrowUp24Regular />
        </button>
        <span className={styles.toolbarTitle}>Files</span>
        <button type="button" className={styles.iconBtn} title="Filter">
          <Filter24Regular />
        </button>
        <span className={styles.spacer} />
        <span className={styles.hint}>
          {docs.length === 0
            ? 'No files yet'
            : `${docs.length} file${docs.length === 1 ? '' : 's'} from this chat`}
        </span>
      </div>

      {docs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Files will appear here</div>
          <div className={styles.emptyBody}>
            Documents created during this appointment workflow — Form 45, Board
            Resolution, ACRA receipt — will be saved to this chat as they
            move through review and signature.
          </div>
        </div>
      ) : (
        <>
          <div className={mergeClasses(styles.legendRow)}>
            <span className={styles.legendCell}>
              <ArrowSortRegular />
              Name
            </span>
            <span className={styles.legendCell}>Modified by</span>
            <span className={styles.legendCell}>Modified</span>
            <span className={styles.legendCell}>Status</span>
          </div>
          <div className={styles.list}>
            {docs.map((d) => (
              <FileChip key={d.id} doc={d} variant="row" />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
