import { makeStyles, Textarea, tokens } from '@fluentui/react-components'
import {
  Attach24Regular,
  Emoji24Regular,
  Image24Regular,
  Send24Filled,
  Sticker24Regular,
  TextFont24Regular,
  Mic24Regular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  wrap: {
    padding: '12px 24px 16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0,
  },
  box: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '8px 12px',
    boxShadow: tokens.shadow2,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '6px',
    paddingTop: '4px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '2px' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '2px' },
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
  send: {
    color: '#5C2E91',
  },
  textarea: {
    minHeight: '36px',
    border: 'none',
    boxShadow: 'none',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  helper: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
})

interface ComposerProps {
  placeholder?: string
  helperText?: string
}

export function Composer({
  placeholder = 'Type a message',
  helperText,
}: ComposerProps) {
  const styles = useStyles()
  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <Textarea
          appearance="outline"
          placeholder={placeholder}
          resize="vertical"
          className={styles.textarea}
          style={{ width: '100%' }}
        />
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button type="button" className={styles.iconBtn} title="Format">
              <TextFont24Regular />
            </button>
            <button type="button" className={styles.iconBtn} title="Attach">
              <Attach24Regular />
            </button>
            <button type="button" className={styles.iconBtn} title="Emoji">
              <Emoji24Regular />
            </button>
            <button type="button" className={styles.iconBtn} title="GIF">
              <Image24Regular />
            </button>
            <button type="button" className={styles.iconBtn} title="Stickers">
              <Sticker24Regular />
            </button>
          </div>
          <div className={styles.toolbarRight}>
            <button type="button" className={styles.iconBtn} title="Voice">
              <Mic24Regular />
            </button>
            <button type="button" className={styles.iconBtn} title="Send">
              <Send24Filled className={styles.send} />
            </button>
          </div>
        </div>
      </div>
      {helperText && <div className={styles.helper}>{helperText}</div>}
    </div>
  )
}
