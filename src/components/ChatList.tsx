import { Fragment } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  Add24Regular,
  Filter24Regular,
  Search24Regular,
} from '@fluentui/react-icons'
import { Avatar } from './Avatar'
import {
  AGENT_AVATAR_SRC,
  CHAT_LISTS,
  type PersonaId,
} from '../personas/personas'

const useStyles = makeStyles({
  pane: {
    width: '320px',
    minWidth: '280px',
    backgroundColor: '#F5F5F5',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px 10px 16px',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#ffffff',
  },
  tools: { display: 'flex', alignItems: 'center', gap: '2px' },
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
  filterRow: {
    display: 'flex',
    gap: '6px',
    padding: '8px 12px 10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#ffffff',
    flexWrap: 'wrap',
  },
  pill: {
    border: '1px solid #C8C6C4',
    borderRadius: '16px',
    padding: '4px 12px',
    fontSize: '12px',
    lineHeight: '18px',
    backgroundColor: '#ffffff',
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
    ':hover': { backgroundColor: '#F3F2F1' },
  },
  pillActive: {
    backgroundColor: '#E8EBFA',
    border: '1px solid #B4B8D9',
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  scroll: { flex: 1, overflowY: 'auto', minHeight: 0 },
  sectionLabel: {
    padding: '12px 16px 4px',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 12px 8px 16px',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    ':hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
  },
  itemActive: {
    backgroundColor: '#EDEBE9',
    borderLeftColor: '#5C2E91',
  },
  itemDimmed: {
    opacity: 0.6,
    cursor: 'default',
    ':hover': { backgroundColor: 'transparent' },
  },
  textCol: { minWidth: 0, flex: 1, paddingTop: '1px' },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'space-between',
  },
  primary: {
    fontSize: '14px',
    lineHeight: '20px',
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: tokens.fontWeightSemibold,
  },
  primaryDimmed: { fontWeight: tokens.fontWeightRegular },
  timestamp: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  secondary: {
    fontSize: '12px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#5C2E91',
    marginLeft: '4px',
    flexShrink: 0,
  },
})

interface ChatListProps {
  persona: PersonaId
  selectedChatId: string
  onSelectChat: (id: string) => void
}

export function ChatList({ persona, selectedChatId, onSelectChat }: ChatListProps) {
  const styles = useStyles()
  const sections = CHAT_LISTS[persona]
  return (
    <aside className={styles.pane} aria-label="Chats">
      <div className={styles.header}>
        <span>Chat</span>
        <div className={styles.tools}>
          <button type="button" className={styles.iconBtn} title="Filter">
            <Filter24Regular />
          </button>
          <button type="button" className={styles.iconBtn} title="Search">
            <Search24Regular />
          </button>
          <button type="button" className={styles.iconBtn} title="New chat">
            <Add24Regular />
          </button>
        </div>
      </div>
      <div className={styles.filterRow}>
        <button type="button" className={styles.pill}>
          Unread
        </button>
        <button type="button" className={styles.pill}>
          Channels
        </button>
        <button
          type="button"
          className={mergeClasses(styles.pill, styles.pillActive)}
        >
          Chats
        </button>
      </div>
      <div className={styles.scroll}>
        {sections.map((section) => (
          <Fragment key={section.id}>
            <div className={styles.sectionLabel}>{section.label}</div>
            {section.entries.map((entry) => {
              const active = entry.id === selectedChatId
              const interactive = entry.isAgentThread
              return (
                <div
                  key={entry.id}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : -1}
                  className={mergeClasses(
                    styles.item,
                    active && styles.itemActive,
                    !interactive && styles.itemDimmed,
                  )}
                  onClick={() => interactive && onSelectChat(entry.id)}
                  onKeyDown={(e) => {
                    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onSelectChat(entry.id)
                    }
                  }}
                  title={interactive ? undefined : 'Decoy chat — not part of this demo'}
                >
                  <Avatar
                    kind={entry.kind}
                    initials={entry.initials}
                    color={entry.avatarColor}
                    size={32}
                    appBadge={entry.kind === 'bot' && interactive}
                    imageSrc={
                      entry.isAgentThread ? AGENT_AVATAR_SRC : undefined
                    }
                    imageAlt={entry.isAgentThread ? entry.name : undefined}
                  />
                  <div className={styles.textCol}>
                    <div className={styles.topRow}>
                      <div
                        className={mergeClasses(
                          styles.primary,
                          !interactive && styles.primaryDimmed,
                        )}
                      >
                        {entry.name}
                      </div>
                      {entry.timestamp && (
                        <span className={styles.timestamp}>{entry.timestamp}</span>
                      )}
                      {entry.unread ? <span className={styles.unreadDot} /> : null}
                    </div>
                    {(entry.preview || entry.subtitle) && (
                      <div className={styles.secondary}>
                        {entry.preview ?? entry.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </aside>
  )
}
