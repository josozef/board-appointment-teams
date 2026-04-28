import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  CallOutbound24Regular,
  Info24Regular,
  MoreHorizontal24Regular,
  Open24Regular,
  Search24Regular,
  Video24Regular,
} from '@fluentui/react-icons'
import { Avatar } from './Avatar'
import { AGENT_AVATAR_SRC, AGENT_NAME, AGENT_SUBTITLE } from '../personas/personas'

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    minHeight: '52px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  left: { display: 'flex', alignItems: 'center', gap: '12px' },
  titleCol: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  tabs: { display: 'flex', gap: '20px', marginLeft: '16px' },
  tab: {
    padding: '14px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    borderBottom: '2px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ':hover': { color: tokens.colorNeutralForeground1 },
  },
  tabActive: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    borderBottomColor: '#5C2E91',
  },
  tabBadge: {
    backgroundColor: '#EDEBE9',
    color: tokens.colorNeutralForeground2,
    borderRadius: '10px',
    fontSize: '11px',
    lineHeight: '16px',
    padding: '0 6px',
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '16px',
    textAlign: 'center',
  },
  tools: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: tokens.colorNeutralForeground2,
  },
  iconBtn: {
    width: '36px',
    height: '36px',
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
})

export type ChatHeaderTab = 'chat' | 'files' | 'about'

interface ChatHeaderProps {
  activeTab: ChatHeaderTab
  onSelectTab: (tab: ChatHeaderTab) => void
  fileCount?: number
}

export function ChatHeader({ activeTab, onSelectTab, fileCount }: ChatHeaderProps) {
  const styles = useStyles()
  const tab = (id: ChatHeaderTab, label: string, badge?: number) => (
    <button
      key={id}
      type="button"
      className={mergeClasses(styles.tab, activeTab === id && styles.tabActive)}
      onClick={() => onSelectTab(id)}
      aria-current={activeTab === id ? 'page' : undefined}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={styles.tabBadge}>{badge}</span>
      )}
    </button>
  )
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Avatar
          kind="bot"
          size={32}
          appBadge
          imageSrc={AGENT_AVATAR_SRC}
          imageAlt={AGENT_NAME}
        />
        <div className={styles.titleCol}>
          <span className={styles.title}>{AGENT_NAME}</span>
          <span className={styles.subtitle}>{AGENT_SUBTITLE}</span>
        </div>
        <div className={styles.tabs}>
          {tab('chat', 'Chat')}
          {tab('files', 'Files', fileCount)}
          {tab('about', 'About')}
        </div>
      </div>
      <div className={styles.tools}>
        <button type="button" className={styles.iconBtn} title="Video call">
          <Video24Regular />
        </button>
        <button type="button" className={styles.iconBtn} title="Audio call">
          <CallOutbound24Regular />
        </button>
        <button type="button" className={styles.iconBtn} title="Search">
          <Search24Regular />
        </button>
        <button type="button" className={styles.iconBtn} title="Info">
          <Info24Regular />
        </button>
        <button type="button" className={styles.iconBtn} title="Pop out chat">
          <Open24Regular />
        </button>
        <button type="button" className={styles.iconBtn} title="More">
          <MoreHorizontal24Regular />
        </button>
      </div>
    </header>
  )
}
