import { useState } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { AppRail } from './AppRail'
import { ChatList } from './ChatList'
import { ChatHeader, type ChatHeaderTab } from './ChatHeader'
import { ChatThread } from './ChatThread'
import { Composer } from './Composer'
import { FilesPane } from './FilesPane'
import { AboutPane } from './AboutPane'
import { useWorkflow } from '../workflow/WorkflowContext'
import { selectDocuments } from '../workflow/documents'
import type { PersonaId } from '../personas/personas'

const useStyles = makeStyles({
  shell: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: '#ffffff',
    color: tokens.colorNeutralForeground1,
    fontSize: '14px',
    lineHeight: '20px',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground2,
  },
})

interface TeamsAppShellProps {
  persona: PersonaId
}

export function TeamsAppShell({ persona }: TeamsAppShellProps) {
  const styles = useStyles()
  const [selectedChatId, setSelectedChatId] = useState('agent')
  const [activeTab, setActiveTab] = useState<ChatHeaderTab>('chat')
  const { workflow } = useWorkflow()
  const fileCount = selectDocuments(workflow).length
  return (
    <div className={styles.shell}>
      <AppRail active="chat" />
      <ChatList
        persona={persona}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
      />
      <main className={styles.main}>
        <ChatHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          fileCount={fileCount}
        />
        {activeTab === 'chat' && <ChatThread persona={persona} />}
        {activeTab === 'files' && <FilesPane />}
        {activeTab === 'about' && <AboutPane />}
        {activeTab === 'chat' && (
          <Composer
            placeholder={
              persona === 'sarah'
                ? 'Reply to Diligent Governance Agent…'
                : 'Type a message'
            }
          />
        )}
      </main>
    </div>
  )
}
