import { makeStyles } from '@fluentui/react-components'
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
})

function PerspectiveSwitcher() {
  const { perspective } = useWorkflow()
  // Re-mount the shell when perspective changes so the chat list and thread
  // start from a fresh scroll position. Cheap and visible.
  return <TeamsAppShell key={perspective} persona={perspective} />
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
