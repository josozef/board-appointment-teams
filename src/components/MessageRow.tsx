import type { ReactNode } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { Avatar } from './Avatar'
import { AGENT_AVATAR_SRC, AGENT_NAME } from '../personas/personas'

const useStyles = makeStyles({
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    margin: '0 0 16px',
    maxWidth: '720px',
  },
  rowUser: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
  },
  bodyCol: { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' },
  bodyColUser: { alignItems: 'flex-end' },
  meta: {
    marginBottom: '4px',
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
    display: 'flex',
    gap: '8px',
    alignItems: 'baseline',
  },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontSize: '12px',
  },
  appBadge: {
    fontSize: '9px',
    fontWeight: tokens.fontWeightBold,
    letterSpacing: '0.05em',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    padding: '0 5px',
    borderRadius: '4px',
    height: '14px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  bubble: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    boxShadow: tokens.shadow2,
    fontSize: '14px',
    lineHeight: '20px',
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'pre-wrap',
    maxWidth: '640px',
  },
  bubbleUser: {
    border: '1px solid #C9CDEC',
    backgroundColor: '#E8EBFA',
  },
  bubbleSystem: {
    border: '1px solid #F0D38E',
    backgroundColor: '#FFF4CE',
    fontSize: '13px',
    color: '#5C3A00',
  },
})

export type MessageVariant = 'bot' | 'user' | 'system'

interface MessageRowProps {
  variant: MessageVariant
  name: string
  timestamp: string
  initials?: string
  avatarColor?: string
  appBadge?: boolean
  children: ReactNode
  /** When true, child is rendered without the bubble (for cards). */
  bare?: boolean
}

export function MessageRow({
  variant,
  name,
  timestamp,
  initials,
  avatarColor,
  appBadge = false,
  children,
  bare = false,
}: MessageRowProps) {
  const styles = useStyles()
  const isUser = variant === 'user'
  const isSystem = variant === 'system'
  return (
    <article
      className={mergeClasses(styles.row, isUser && styles.rowUser)}
      aria-label={`${name} message`}
    >
      <Avatar
        kind={variant === 'bot' ? 'bot' : 'person'}
        initials={initials}
        color={avatarColor}
        size={32}
        appBadge={appBadge}
        imageSrc={variant === 'bot' ? AGENT_AVATAR_SRC : undefined}
        imageAlt={variant === 'bot' ? AGENT_NAME : undefined}
      />
      <div
        className={mergeClasses(styles.bodyCol, isUser && styles.bodyColUser)}
      >
        <div className={styles.meta}>
          <span className={styles.name}>{name}</span>
          {appBadge && <span className={styles.appBadge}>APP</span>}
          <time>{timestamp}</time>
        </div>
        {bare ? (
          children
        ) : (
          <div
            className={mergeClasses(
              styles.bubble,
              isUser && styles.bubbleUser,
              isSystem && styles.bubbleSystem,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </article>
  )
}
