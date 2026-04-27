/**
 * Demo personas. Each persona is a separate "Teams account" the demo
 * ribbon switches between. Every persona has:
 *  - identity for header/avatar
 *  - a chat-list scaffold (the active 1:1 with the agent + decoy chats for realism)
 */

export type PersonaId = 'sarah' | 'priya' | 'robert'

export interface Persona {
  id: PersonaId
  name: string
  title: string
  email: string
  initials: string
  avatarColor: string
  shortLabel: string
  perspectiveLabel: string
}

export const SARAH: Persona = {
  id: 'sarah',
  name: 'Sarah Chen',
  title: 'Corporate Secretary, Acme, Inc.',
  email: 'sarah.chen@acme.com',
  initials: 'SC',
  avatarColor: '#5C2E91',
  shortLabel: 'Sarah',
  perspectiveLabel: 'Corporate Secretary',
}

export const PRIYA: Persona = {
  id: 'priya',
  name: 'Priya Nair',
  title: 'Regional Finance Director, APAC',
  email: 'priya.nair@pacificpolymer.com',
  initials: 'PN',
  avatarColor: '#0F6CBD',
  shortLabel: 'Priya',
  perspectiveLabel: 'Appointee',
}

export const ROBERT: Persona = {
  id: 'robert',
  name: 'Robert Johnson',
  title: 'Committee Chair, Acme Board',
  email: 'robert.johnson@acme.com',
  initials: 'RJ',
  avatarColor: '#0E7C42',
  shortLabel: 'Robert',
  perspectiveLabel: 'Board approver',
}

export const PERSONAS: Persona[] = [SARAH, PRIYA, ROBERT]

export const PERSONA_BY_ID: Record<PersonaId, Persona> = {
  sarah: SARAH,
  priya: PRIYA,
  robert: ROBERT,
}

export const AGENT_NAME = 'Diligent Governance Agent'
export const AGENT_SHORT = 'Diligent Agent'
export const AGENT_SUBTITLE = 'Board appointment workflow · App'
export const AGENT_AVATAR_SRC = '/assets/diligent-agent-avatar.png'

/** Chat list shown in the left chat pane for each persona. */
export interface ChatListEntry {
  id: string
  name: string
  subtitle?: string
  preview?: string
  timestamp?: string
  kind: 'bot' | 'person' | 'group'
  initials?: string
  avatarColor?: string
  unread?: number
  /** Marks this as the active (bot) thread tied to the workflow. */
  isAgentThread?: boolean
}

export interface ChatListSection {
  id: string
  label: string
  entries: ChatListEntry[]
}

const AGENT_ENTRY: ChatListEntry = {
  id: 'agent',
  name: AGENT_NAME,
  subtitle: 'Board appointment workflow',
  kind: 'bot',
  isAgentThread: true,
}

const colors = {
  legal: '#5C2E91',
  ops: '#0F6CBD',
  green: '#0E7C42',
  burgundy: '#9F2A38',
  gold: '#A36F00',
  teal: '#1F7A7A',
}

export const CHAT_LISTS: Record<PersonaId, ChatListSection[]> = {
  sarah: [
    {
      id: 'apps',
      label: 'Apps',
      entries: [AGENT_ENTRY],
    },
    {
      id: 'teams',
      label: 'Teams and channels',
      entries: [
        {
          id: 'acme-cosec-leadership',
          name: 'Acme CoSec — Leadership',
          subtitle: 'Margaret: Q2 board calendar attached',
          timestamp: '9:14 AM',
          kind: 'group',
          initials: 'AC',
          avatarColor: colors.legal,
        },
        {
          id: 'acme-cosec-apac',
          name: 'Acme CoSec — APAC entities',
          subtitle: 'Filing reminders for May',
          timestamp: 'Yesterday',
          kind: 'group',
          initials: 'AP',
          avatarColor: colors.ops,
        },
        {
          id: 'subsidiary-filings',
          name: 'Subsidiary filings updates',
          subtitle: 'Marcus: ACRA portal scheduled maintenance',
          timestamp: 'Mon',
          kind: 'group',
          initials: 'SF',
          avatarColor: colors.gold,
        },
      ],
    },
    {
      id: 'recent',
      label: 'Recent',
      entries: [
        {
          id: 'elena-park',
          name: 'Elena Park',
          subtitle: 'Deputy Corporate Secretary',
          preview: 'Got it, I\'ll cover the EU board pack',
          timestamp: '8:42 AM',
          kind: 'person',
          initials: 'EP',
          avatarColor: colors.green,
        },
        {
          id: 'jordan-lee',
          name: 'Jordan Lee',
          subtitle: 'Governance paralegal',
          preview: 'Resolution template updated for SG',
          timestamp: 'Yesterday',
          kind: 'person',
          initials: 'JL',
          avatarColor: colors.green,
        },
        {
          id: 'marcus-chen',
          name: 'Marcus Chen',
          subtitle: 'Subsidiary filings liaison',
          preview: 'Re: ACRA Form 45 attachments',
          timestamp: 'Yesterday',
          kind: 'person',
          initials: 'MC',
          avatarColor: colors.green,
        },
        {
          id: 'maya-patel',
          name: 'Maya Patel',
          subtitle: 'HR Business Partner, APAC',
          preview: 'Confirmed David\'s last working day — May 17',
          timestamp: 'Mon',
          kind: 'person',
          initials: 'MP',
          avatarColor: colors.burgundy,
        },
      ],
    },
  ],
  priya: [
    {
      id: 'apps',
      label: 'Apps',
      entries: [AGENT_ENTRY],
    },
    {
      id: 'teams',
      label: 'Teams and channels',
      entries: [
        {
          id: 'pacific-polymer-leadership',
          name: 'Pacific Polymer — Leadership',
          subtitle: 'Q2 close kickoff',
          timestamp: '10:08 AM',
          kind: 'group',
          initials: 'PP',
          avatarColor: colors.ops,
        },
        {
          id: 'apac-finance',
          name: 'APAC Finance leadership',
          subtitle: 'Margin update by region',
          timestamp: 'Yesterday',
          kind: 'group',
          initials: 'AF',
          avatarColor: colors.teal,
        },
      ],
    },
    {
      id: 'recent',
      label: 'Recent',
      entries: [
        {
          id: 'yusuf-kim',
          name: 'Yusuf Kim',
          subtitle: 'Group CFO',
          preview: 'Thanks for the FX walk',
          timestamp: '9:52 AM',
          kind: 'person',
          initials: 'YK',
          avatarColor: colors.green,
        },
        {
          id: 'workday-alerts',
          name: 'Workday alerts',
          subtitle: 'Notifications',
          preview: '1 new task assigned to you',
          timestamp: '8:30 AM',
          kind: 'bot',
          initials: 'WD',
          avatarColor: colors.gold,
        },
        {
          id: 'it-support',
          name: 'IT Support',
          subtitle: 'Service desk',
          preview: 'Ticket #44218 resolved',
          timestamp: 'Yesterday',
          kind: 'group',
          initials: 'IT',
          avatarColor: colors.burgundy,
        },
      ],
    },
  ],
  robert: [
    {
      id: 'apps',
      label: 'Apps',
      entries: [AGENT_ENTRY],
    },
    {
      id: 'teams',
      label: 'Teams and channels',
      entries: [
        {
          id: 'nominating-governance',
          name: 'Acme Nominating & Governance',
          subtitle: 'Q2 succession review',
          timestamp: '7:30 AM',
          kind: 'group',
          initials: 'NG',
          avatarColor: colors.legal,
        },
        {
          id: 'audit-committee',
          name: 'Acme Audit Committee',
          subtitle: 'Internal audit findings',
          timestamp: 'Mon',
          kind: 'group',
          initials: 'AC',
          avatarColor: colors.gold,
        },
        {
          id: 'board-chair-circle',
          name: 'Acme Board chair circle',
          subtitle: 'Pre-read for May meeting',
          timestamp: 'Sun',
          kind: 'group',
          initials: 'BC',
          avatarColor: colors.burgundy,
        },
      ],
    },
    {
      id: 'recent',
      label: 'Recent',
      entries: [
        {
          id: 'margaret-sullivan',
          name: 'Margaret Sullivan',
          subtitle: 'Chief Executive Officer',
          preview: 'Catch-up before Thursday?',
          timestamp: '7:45 AM',
          kind: 'person',
          initials: 'MS',
          avatarColor: colors.green,
        },
        {
          id: 'linda-williams',
          name: 'Linda Williams',
          subtitle: 'Independent Director',
          preview: 'Sent the pre-read comments',
          timestamp: 'Yesterday',
          kind: 'person',
          initials: 'LW',
          avatarColor: colors.green,
        },
        {
          id: 'external-counsel',
          name: 'Wong & Lee LLP',
          subtitle: 'External counsel',
          preview: 'Re: APAC director changes',
          timestamp: 'Mon',
          kind: 'group',
          initials: 'WL',
          avatarColor: colors.burgundy,
        },
        {
          id: 'diligent-boards',
          name: 'Diligent Boards',
          subtitle: 'Board portal',
          preview: 'New documents for review',
          timestamp: 'Mon',
          kind: 'bot',
          initials: 'DB',
          avatarColor: colors.legal,
        },
      ],
    },
  ],
}
