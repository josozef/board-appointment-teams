/**
 * Mock data for the demo. Pacific Polymer scenario, drawn from
 * docs/02-mock-data.md. The static records here stand in for live
 * Workday / entity register / regulator integrations.
 */
import type {
  Approver,
  AppointmentWorkflow,
  Candidate,
  EntityRef,
  PersonRef,
} from './types'

export const PACIFIC_POLYMER: EntityRef = {
  id: 'c5',
  name: 'Pacific Polymer Logistics Pte. Ltd.',
  uen: '202100789K',
  location: 'Singapore',
  country: 'Singapore',
  jurisdiction: 'SG',
}

export const DAVID_CHEN: PersonRef = {
  id: 'p-david-chen',
  name: 'Wei "David" Chen',
  title: 'Director, Pacific Polymer Logistics',
  employer: PACIFIC_POLYMER,
}

export const PRIYA_NAIR: Candidate = {
  id: 'p-priya-nair',
  name: 'Priya Nair',
  title: 'Regional Finance Director, APAC',
  employer: PACIFIC_POLYMER,
  matchPct: 94,
  resident: true,
  notes: 'Singapore resident · No disqualifications · Strong finance background',
  recommended: true,
}

export const LIM_PEI_SHAN: Candidate = {
  id: 'p-lim-pei-shan',
  name: 'Lim Pei Shan',
  title: 'Director of Risk Management',
  employer: PACIFIC_POLYMER,
  matchPct: 87,
  resident: true,
  notes: 'Singapore resident · Compliance expertise · Risk Committee member',
}

export const KENJI_TANAKA: Candidate = {
  id: 'p-kenji-tanaka',
  name: 'Kenji Tanaka',
  title: 'Head of Digital Transformation',
  employer: PACIFIC_POLYMER,
  matchPct: 72,
  resident: false,
  notes:
    'Non-resident · May not satisfy Singapore local-director requirement without additional arrangements',
}

export const CANDIDATE_POOL: Candidate[] = [
  PRIYA_NAIR,
  LIM_PEI_SHAN,
  KENJI_TANAKA,
]

export const ROBERT_JOHNSON: Approver = {
  id: 'robert-johnson',
  name: 'Robert Johnson',
  initials: 'RJ',
  title: 'Committee Chair',
  email: 'robert.johnson@acme.com',
  fromCommittee: 'Nominating & Governance',
}

export const MARGARET_SULLIVAN: Approver = {
  id: 'margaret-sullivan',
  name: 'Margaret Sullivan',
  initials: 'MS',
  title: 'Chief Executive Officer',
  email: 'margaret.sullivan@acme.com',
  fromCommittee: 'Executive',
}

export const LINDA_WILLIAMS: Approver = {
  id: 'linda-williams',
  name: 'Linda Williams',
  initials: 'LW',
  title: 'Independent Director',
  email: 'linda.williams@acme.com',
  fromCommittee: 'Audit',
}

export const DAVID_MARTINEZ: Approver = {
  id: 'david-martinez',
  name: 'David Martinez',
  initials: 'DM',
  title: 'Independent Director',
  email: 'david.martinez@acme.com',
  fromCommittee: 'Nominating & Governance',
}

export const APPROVER_POOL: Approver[] = [
  ROBERT_JOHNSON,
  MARGARET_SULLIVAN,
  LINDA_WILLIAMS,
  DAVID_MARTINEZ,
]

const filingDeadline = '2026-05-31'

export function buildInitialWorkflow(): AppointmentWorkflow {
  const now = new Date().toISOString()
  return {
    id: 'wf-pacific-polymer-2026-04-17',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    trigger: {
      source: 'workday.resignation',
      detectedAt: now,
      payload: {
        employeeId: 'WD-2841',
        employeeName: 'Wei "David" Chen',
        entity: 'Pacific Polymer Logistics Pte. Ltd.',
        lastWorkingDay: '2026-05-17',
      },
      framing:
        'Workday flagged a director resignation at Pacific Polymer Logistics Pte. Ltd. (Singapore). David Chen\'s last working day is May 17, 2026 — the local-director requirement under the Companies Act must continue to be met.',
      filingDeadline,
    },
    triggerAcknowledged: false,
    entity: PACIFIC_POLYMER,
    isReplacement: true,
    departingDirector: DAVID_CHEN,

    selectedCandidate: null,
    candidatePool: CANDIDATE_POOL,
    appointmentNric: null,
    appointmentEffectiveDate: null,

    consentDocument: {
      content:
        'Consent to Act as Director — Form 45 (s.145(5), Companies Act, Cap. 50). I, [Appointee Name], NRIC [NRIC], hereby consent to act as a director of Pacific Polymer Logistics Pte. Ltd. (UEN 202100789K) with effect from [Effective Date].',
      sent: false,
      sentAt: null,
      replacedByUpload: null,
      signedAt: null,
    },

    approvers: {
      confirmed: false,
      selected: APPROVER_POOL,
    },

    boardResolution: {
      content:
        'WHEREAS the Board of Pacific Polymer Logistics Pte. Ltd. has accepted the resignation of Wei "David" Chen effective 17 May 2026; AND WHEREAS the Board wishes to appoint a replacement director to maintain compliance with s.145 of the Companies Act; NOW THEREFORE BE IT RESOLVED that [Appointee Name] is hereby appointed as a Director of the Company effective [Effective Date].',
      sent: false,
      sentAt: null,
      signedAt: null,
    },

    steps: [
      {
        id: 'identify-candidate',
        name: 'Identify replacement candidate',
        status: 'in_progress',
        substeps: ['Workday integration', 'Jurisdictional screening', 'Candidate shortlist'],
      },
      {
        id: 'collect-data',
        name: 'Collect appointment data',
        status: 'not_started',
        substeps: ['Entities & appointment', 'Consent to act document'],
      },
      {
        id: 'select-approvers',
        name: 'Configure approvers',
        status: 'not_started',
        substeps: ['Select approvers', 'Board resolution'],
      },
      {
        id: 'board-approval',
        name: 'Board approval',
        status: 'not_started',
        substeps: ['Send resolution', 'Collect votes'],
      },
      {
        id: 'filing',
        name: 'Regulatory filing',
        status: 'not_started',
        substeps: ['Download documents', 'File with ACRA', 'Confirm filing'],
      },
      {
        id: 'update-entities',
        name: 'Update entity records',
        status: 'not_started',
        substeps: ['Record resignation', 'Record appointment'],
      },
    ],

    agentic: {
      active: false,
      paused: false,
      votes: APPROVER_POOL.map((a) => ({
        id: a.id,
        name: a.name,
        title: a.title,
        status: 'pending' as const,
        time: null,
      })),
      filingSubsteps: [
        { name: 'Download signed documents', status: 'pending', time: null },
        { name: 'e-File with ACRA', status: 'pending', time: null },
        { name: 'Confirm filing', status: 'pending', time: null },
      ],
      entitySubsteps: [
        { name: 'Record resignation — David Chen', status: 'pending', time: null },
        { name: 'Record appointment — selected candidate', status: 'pending', time: null },
      ],
      processComplete: false,
    },
  }
}
