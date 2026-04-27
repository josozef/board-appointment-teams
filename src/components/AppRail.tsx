import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import {
  Alert24Regular,
  Calendar24Regular,
  CallOutbound24Regular,
  Chat24Filled,
  Cloud24Regular,
  People24Regular,
  Sparkle24Regular,
  TextBulletListSquare24Regular,
} from '@fluentui/react-icons'
import { Avatar } from './Avatar'
import { AGENT_AVATAR_SRC, AGENT_NAME } from '../personas/personas'

const useStyles = makeStyles({
  rail: {
    width: '68px',
    minWidth: '68px',
    backgroundColor: '#33344A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '8px',
    gap: '2px',
    color: '#ffffff',
  },
  btn: {
    width: '52px',
    height: '52px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontSize: '10px',
    lineHeight: '12px',
    borderRadius: '0',
    position: 'relative',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
  },
  active: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    fontWeight: tokens.fontWeightSemibold,
    ':before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '12px',
      bottom: '12px',
      width: '3px',
      borderRadius: '0 2px 2px 0',
      backgroundColor: '#A78BFA',
    },
  },
  spacer: { flex: 1 },
  appsLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.55)',
    margin: '6px 0 4px',
  },
  appIcon: {
    width: '36px',
    height: '36px',
    marginBottom: '8px',
  },
})

type ActiveId =
  | 'activity'
  | 'chat'
  | 'teams'
  | 'calendar'
  | 'calls'
  | 'files'
  | 'apps'

interface AppRailProps {
  active?: ActiveId
}

const RAIL_ITEMS: { id: ActiveId; label: string; icon: React.ReactNode }[] = [
  { id: 'activity', label: 'Activity', icon: <Alert24Regular /> },
  { id: 'chat', label: 'Chat', icon: <Chat24Filled /> },
  { id: 'teams', label: 'Teams', icon: <People24Regular /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar24Regular /> },
  { id: 'calls', label: 'Calls', icon: <CallOutbound24Regular /> },
  { id: 'files', label: 'Tasks', icon: <TextBulletListSquare24Regular /> },
  { id: 'apps', label: 'OneDrive', icon: <Cloud24Regular /> },
  { id: 'apps', label: 'Copilot', icon: <Sparkle24Regular /> },
]

export function AppRail({ active = 'chat' }: AppRailProps) {
  const styles = useStyles()
  return (
    <nav className={styles.rail} aria-label="App navigation">
      {RAIL_ITEMS.map((item, i) => (
        <button
          key={`${item.label}-${i}`}
          type="button"
          className={mergeClasses(styles.btn, item.id === active && styles.active)}
          title={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
      <div className={styles.spacer} />
      <span className={styles.appsLabel}>Apps</span>
      <span className={styles.appIcon} aria-hidden>
        <Avatar
          kind="bot"
          size={32}
          imageSrc={AGENT_AVATAR_SRC}
          imageAlt={AGENT_NAME}
        />
      </span>
    </nav>
  )
}
