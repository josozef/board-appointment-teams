import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FluentProvider theme={teamsLightTheme}>
      <App />
    </FluentProvider>
  </StrictMode>,
)
