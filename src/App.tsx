import { makeStyles, mergeClasses } from '@fluentui/react-components'
import { useEffect, useRef, useState } from 'react'
import { DemoRibbon } from './components/DemoRibbon'
import { TeamsAppShell } from './components/TeamsAppShell'
import { WorkflowProvider, useWorkflow } from './workflow/WorkflowContext'

const useStyles = makeStyles({
  root: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  shellWrap: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  shellContent: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0,
    zIndex: 2,
    transitionProperty: 'opacity',
    transitionDuration: '220ms',
    transitionTimingFunction: 'ease-out',
    background:
      'linear-gradient(110deg, rgba(92,46,145,0.16) 0%, rgba(111,97,171,0.12) 45%, rgba(92,46,145,0.08) 100%)',
  },
  washVisible: {
    opacity: 1,
  },
})

function PerspectiveSwitcher() {
  const styles = useStyles()
  const { perspective } = useWorkflow()
  const [showWash, setShowWash] = useState(false)
  const seenFirstPerspective = useRef(false)

  useEffect(() => {
    if (!seenFirstPerspective.current) {
      seenFirstPerspective.current = true
      return
    }
    setShowWash(true)
    const timer = window.setTimeout(() => setShowWash(false), 260)
    return () => window.clearTimeout(timer)
  }, [perspective])

  // Re-mount the shell when perspective changes so the chat list and thread
  // start from a fresh scroll position. Cheap and visible.
  return (
    <div className={styles.shellWrap}>
      <div className={styles.shellContent}>
        <TeamsAppShell key={perspective} persona={perspective} />
        <div className={mergeClasses(styles.wash, showWash && styles.washVisible)} />
      </div>
    </div>
  )
}

function App() {
  const styles = useStyles()
  return (
    <WorkflowProvider>
      <div className={styles.root}>
        <DemoRibbon />
        <PerspectiveSwitcher />
      </div>
    </WorkflowProvider>
  )
}

export default App
