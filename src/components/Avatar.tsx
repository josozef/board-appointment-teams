import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

interface AvatarProps {
  kind: 'bot' | 'person' | 'group'
  initials?: string
  color?: string
  size?: 24 | 28 | 32 | 40
  presence?: 'available' | 'busy' | 'away' | 'offline' | 'dnd'
  appBadge?: boolean
  imageSrc?: string
  imageAlt?: string
}

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
  },
  inner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
  },
  person: {
    borderRadius: '50%',
  },
  group: {
    borderRadius: tokens.borderRadiusMedium,
  },
  bot: {
    borderRadius: tokens.borderRadiusMedium,
    background:
      'linear-gradient(135deg, #5C2E91 0%, #7B53D6 50%, #4F52B2 100%)',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  presenceDot: {
    position: 'absolute',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    bottom: 0,
    right: 0,
    border: '2px solid #ffffff',
  },
  available: { backgroundColor: '#13A10E' },
  busy: { backgroundColor: '#C50F1F' },
  away: { backgroundColor: '#FFAA44' },
  dnd: { backgroundColor: '#C50F1F' },
  offline: { backgroundColor: '#8A8886' },
  appBadge: {
    position: 'absolute',
    bottom: '-3px',
    right: '-3px',
    fontSize: '8px',
    fontWeight: tokens.fontWeightBold,
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    padding: '0 3px',
    lineHeight: '11px',
    height: '12px',
    boxShadow: tokens.shadow2,
  },
})

export function Avatar({
  kind,
  initials = '?',
  color,
  size = 32,
  presence,
  appBadge = false,
  imageSrc,
  imageAlt,
}: AvatarProps) {
  const styles = useStyles()
  const fontSize =
    size <= 24 ? 10 : size <= 28 ? 11 : size <= 32 ? 12 : 14

  let classes = styles.inner
  if (kind === 'person') classes = mergeClasses(styles.inner, styles.person)
  else if (kind === 'group') classes = mergeClasses(styles.inner, styles.group)
  else classes = mergeClasses(styles.inner, styles.bot)

  return (
    <span
      className={styles.root}
      style={{ width: size, height: size }}
      aria-hidden={imageSrc ? undefined : true}
    >
      <span
        className={classes}
        style={{
          backgroundColor: imageSrc
            ? '#ffffff'
            : kind === 'bot'
              ? undefined
              : color ?? '#5C2E91',
          fontSize,
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt ?? ''}
            className={styles.img}
            draggable={false}
          />
        ) : kind === 'bot' ? (
          '◆'
        ) : (
          initials
        )}
      </span>
      {presence && (
        <span
          className={mergeClasses(styles.presenceDot, styles[presence])}
          aria-label={`Status: ${presence}`}
        />
      )}
      {appBadge && <span className={styles.appBadge}>APP</span>}
    </span>
  )
}
