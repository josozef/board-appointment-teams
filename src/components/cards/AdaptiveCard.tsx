import type { ReactNode } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '640px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px 10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#FAF9F8',
  },
  iconBubble: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #5C2E91 0%, #4F52B2 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
    minWidth: 0,
    flex: 1,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  pill: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '999px',
    backgroundColor: '#E8EBFA',
    color: '#3D3F8C',
  },
  pillResolved: {
    backgroundColor: '#DDF6E6',
    color: '#0F5132',
  },
  pillRunning: {
    backgroundColor: '#FFF4CE',
    color: '#5C3A00',
  },
  body: { padding: '14px 16px' },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '10px 16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: '#FAF9F8',
    flexWrap: 'wrap',
  },
  resolved: {
    opacity: 0.94,
  },
})

export type CardStatus = 'awaiting' | 'running' | 'resolved'

interface AdaptiveCardProps {
  icon: ReactNode
  title: string
  subtitle?: string
  status?: CardStatus
  statusLabel?: string
  body: ReactNode
  footer?: ReactNode
}

export function AdaptiveCard({
  icon,
  title,
  subtitle,
  status,
  statusLabel,
  body,
  footer,
}: AdaptiveCardProps) {
  const styles = useStyles()
  return (
    <div
      className={mergeClasses(
        styles.card,
        status === 'resolved' && styles.resolved,
      )}
    >
      <div className={styles.header}>
        <span className={styles.iconBubble}>{icon}</span>
        <div className={styles.titleCol}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {statusLabel && (
          <span
            className={mergeClasses(
              styles.pill,
              status === 'resolved' && styles.pillResolved,
              status === 'running' && styles.pillRunning,
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>
      <div className={styles.body}>{body}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
