/**
 * Teams-native file attachment chip.
 *
 * Renders inline in chat messages or as a list row. Click → openDocument()
 * pops a styled HTML preview that mimics Word / Acrobat in a new tab.
 */
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  DocumentBulletList20Filled,
  DocumentPdf20Filled,
  Open16Regular,
  MoreHorizontal16Regular,
} from '@fluentui/react-icons'
import {
  formatModifiedDisplay,
  formatSize,
  openDocument,
  type WorkflowDocument,
} from '../workflow/documents'

const useStyles = makeStyles({
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px 8px 8px',
    backgroundColor: '#ffffff',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'left',
    color: tokens.colorNeutralForeground1,
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '120ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      boxShadow: tokens.shadow2,
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: '1px',
    },
  },
  chipRow: {
    maxWidth: 'unset',
    width: '100%',
  },
  iconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWord: { backgroundColor: '#E1EBF7', color: '#2B579A' },
  iconPdf: { backgroundColor: '#FCE6E6', color: '#D9261C' },
  meta: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  filename: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sub: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  dot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    color: tokens.colorNeutralForeground2,
  },
  actionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    ':hover': { backgroundColor: 'rgba(0,0,0,0.06)' },
  },
})

interface FileChipProps {
  doc: WorkflowDocument
  /** When true, renders full-width with size + modified info (used in FilesPane). */
  variant?: 'inline' | 'row'
}

export function FileChip({ doc, variant = 'inline' }: FileChipProps) {
  const styles = useStyles()
  const isWord = doc.kind === 'docx'
  const open = () => openDocument(doc)

  return (
    <button
      type="button"
      className={mergeClasses(styles.chip, variant === 'row' && styles.chipRow)}
      onClick={open}
      title={`Open ${doc.filename} in ${isWord ? 'Microsoft Word' : 'Adobe Acrobat'}`}
    >
      <span
        className={mergeClasses(
          styles.iconWrap,
          isWord ? styles.iconWord : styles.iconPdf,
        )}
        aria-hidden
      >
        {isWord ? (
          <DocumentBulletList20Filled />
        ) : (
          <DocumentPdf20Filled />
        )}
      </span>
      <span className={styles.meta}>
        <span className={styles.filename}>{doc.filename}</span>
        <span className={styles.sub}>
          <span>{isWord ? 'Word document' : 'PDF'}</span>
          <span className={styles.dot} aria-hidden />
          <span>{formatSize(doc.sizeBytes)}</span>
          {variant === 'row' && (
            <>
              <span className={styles.dot} aria-hidden />
              <span>
                Modified {formatModifiedDisplay(doc.modifiedAt)} · {doc.modifiedBy}
              </span>
            </>
          )}
        </span>
      </span>
      <span className={styles.actions} aria-hidden>
        <span className={styles.actionBtn} title="Open in new tab">
          <Open16Regular />
        </span>
        <span className={styles.actionBtn} title="More options">
          <MoreHorizontal16Regular />
        </span>
      </span>
    </button>
  )
}
