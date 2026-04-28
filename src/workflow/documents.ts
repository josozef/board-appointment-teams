/**
 * Document model for workflow Files.
 * Documents are derived from workflow state and point to real uploaded assets.
 */
import type { AppointmentWorkflow } from './types'
import type { PersonaId } from '../personas/personas'
import { AGENT_NAME } from '../personas/personas'

export type DocumentKind = 'docx' | 'pdf'

export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'signed'
  | 'filed'
  | 'final'

export interface WorkflowDocument {
  id: string
  filename: string
  kind: DocumentKind
  title: string
  subtitle: string
  modifiedBy: string
  modifiedAt: string | null
  sizeBytes: number
  status: DocumentStatus
  sourceUrl: string
}

const formatModified = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}

const formatBytes = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`
  if (n >= 1_000) return `${Math.round(n / 1_000)} KB`
  return `${n} B`
}

export const formatModifiedDisplay = formatModified
export const formatSize = formatBytes

const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export function selectDocuments(workflow: AppointmentWorkflow): WorkflowDocument[] {
  const docs: WorkflowDocument[] = []
  const consent = workflow.consentDocument
  const resolution = workflow.boardResolution
  const appointee = workflow.selectedCandidate
  const filingStarted =
    workflow.steps.find((s) => s.id === 'filing')?.status !== 'not_started'
  const filingDone =
    workflow.steps.find((s) => s.id === 'filing')?.status === 'completed'

  const DOC_ASSETS = {
    consent: '/assets/docs/consent-to-act-priya-nair.docx',
    resolution: '/assets/docs/board-resolution-pacific-polymer-priya-nair.docx',
    form45: '/assets/docs/form-45-pacific-polymer.docx',
  } as const

  if (appointee) {
    let status: DocumentStatus = 'draft'
    if (consent.signedAt) status = 'signed'
    else if (consent.sent) status = 'sent'
    const lastEdit = consent.signedAt ?? consent.sentAt ?? workflow.updatedAt
    docs.push({
      id: 'doc-consent-to-act',
      filename: `Consent to Act - ${appointee.name}.docx`,
      kind: 'docx',
      title: 'Consent to Act as Director',
      subtitle: `Companies Act s.145(5) · ${workflow.entity.name}`,
      modifiedBy: status === 'signed' ? appointee.name : AGENT_NAME,
      modifiedAt: lastEdit,
      sizeBytes: 32_305,
      status,
      sourceUrl: DOC_ASSETS.consent,
    })
  }

  if (workflow.approvers.confirmed || resolution.sent) {
    const allApproved =
      workflow.agentic.votes.length > 0 &&
      workflow.agentic.votes.every((v) => v.status === 'approved')
    let status: DocumentStatus = 'draft'
    if (allApproved) status = 'signed'
    else if (resolution.sent) status = 'sent'
    const lastEdit = resolution.signedAt ?? resolution.sentAt ?? workflow.updatedAt
    docs.push({
      id: 'doc-board-resolution',
      filename: `Board Resolution - Pacific Polymer Logistics Pte. Ltd. - ${appointee?.name ?? 'Director Appointment'}.docx`,
      kind: 'docx',
      title: 'Board Resolution — Director Appointment',
      subtitle: 'Acme · Nominating & Governance Committee',
      modifiedBy: AGENT_NAME,
      modifiedAt: lastEdit,
      sizeBytes: 35_445,
      status,
      sourceUrl: DOC_ASSETS.resolution,
    })
  }

  if (filingStarted) {
    const status: DocumentStatus = filingDone ? 'filed' : 'draft'
    docs.push({
      id: 'doc-form-45',
      filename: 'Form 45 - Pacific Polymer Logistics.docx',
      kind: 'docx',
      title: 'Form 45 — Notification of Change of Director',
      subtitle: 'ACRA BizFile+ · Companies Act s.173(6) · Singapore',
      modifiedBy: AGENT_NAME,
      modifiedAt: workflow.updatedAt,
      sizeBytes: 31_833,
      status,
      sourceUrl: DOC_ASSETS.form45,
    })
  }

  return docs
}

export function selectDocumentsForPersona(
  workflow: AppointmentWorkflow,
  persona: PersonaId,
): WorkflowDocument[] {
  const docs = selectDocuments(workflow)
  if (persona === 'priya') {
    return docs.filter((d) => d.id === 'doc-consent-to-act')
  }
  if (persona === 'robert') {
    return docs.filter((d) => d.id === 'doc-board-resolution')
  }
  return docs
}

const docxShell = (doc: WorkflowDocument, bodyHtml: string) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>${escape(doc.filename)} — Microsoft Word</title>
<style>
  :root { color-scheme: light; }
  html, body { margin: 0; min-height: 100%; background: #f3f2f1; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; color: #201f1e; }
  .titlebar { background: #185ABD; color: #fff; padding: 6px 12px; font-size: 12px; display: flex; gap: 8px; align-items: center; position: sticky; top: 0; z-index: 2; }
  .titlebar .word-mark { background: #fff; color: #185ABD; font-weight: 700; padding: 2px 6px; border-radius: 2px; font-size: 11px; }
  .titlebar .status-pill { background: rgba(255,255,255,.15); padding: 2px 8px; border-radius: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .ribbon { background: #fff; border-bottom: 1px solid #e1dfdd; padding: 6px 12px; display: flex; gap: 16px; font-size: 12px; color: #605e5c; position: sticky; top: 24px; z-index: 1; }
  .ribbon span { padding: 2px 6px; }
  .ribbon .home { color: #201f1e; font-weight: 600; border-bottom: 2px solid #185ABD; }
  .page-wrap { padding: 32px 0; display: flex; justify-content: center; }
  .page { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.08); width: min(720px, calc(100% - 32px)); padding: 72px 80px 96px; font-family: "Cambria", "Georgia", serif; font-size: 11pt; line-height: 1.55; color: #201f1e; }
  .page p { margin: 0 0 12px; }
  .page h1 { font-size: 18pt; margin: 0 0 8px; font-weight: 700; }
  .page h2 { font-size: 14pt; margin: 18px 0 6px; font-weight: 700; }
  .page h3 { font-size: 12pt; margin: 14px 0 6px; font-weight: 700; }
  .page table { border-collapse: collapse; margin: 6px 0 14px; }
  .page td, .page th { border: 1px solid #c8c6c4; padding: 4px 8px; vertical-align: top; }
  .page ul, .page ol { margin: 0 0 12px 0; padding-left: 24px; }
  .signature-block { margin-top: 36px; border-top: 1px solid #c8c6c4; padding-top: 18px; font-size: 10pt; color: #605e5c; }
  .error { color: #b91c1c; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; padding: 24px; }
</style>
</head><body>
  <div class="titlebar">
    <span class="word-mark">W</span>
    <span>${escape(doc.filename)}</span>
    <span class="status-pill">${escape(doc.status)}</span>
    <span style="opacity:.7">— Saved</span>
  </div>
  <div class="ribbon">
    <span class="home">Home</span>
    <span>Insert</span><span>Layout</span><span>References</span><span>Review</span><span>View</span>
  </div>
  <div class="page-wrap"><div class="page">
    ${bodyHtml}
    <div class="signature-block">
      <p><strong>Status:</strong> ${escape(doc.status.toUpperCase())}</p>
      <p><strong>Last modified:</strong> ${escape(formatModified(doc.modifiedAt))} · ${escape(doc.modifiedBy)}</p>
    </div>
  </div></div>
</body></html>`

const errorShell = (doc: WorkflowDocument, err: string) =>
  docxShell(
    doc,
    `<h1>${escape(doc.title)}</h1><p class="error">Could not load this document: ${escape(err)}</p>`,
  )

/** Open a Word-styled browser view for uploaded docs. */
export async function openDocument(doc: WorkflowDocument) {
  const w = window.open('about:blank', '_blank')
  if (!w) return
  w.document.write(
    `<!doctype html><html><head><title>${escape(doc.filename)}</title>
     <style>html,body{margin:0;font-family:-apple-system,"Segoe UI",system-ui;background:#f3f2f1;color:#201f1e}
     .splash{display:flex;align-items:center;gap:10px;padding:32px;font-size:13px;color:#605e5c}
     .word-mark{background:#185ABD;color:#fff;font-weight:700;padding:2px 6px;border-radius:2px}
     </style></head><body><div class="splash"><span class="word-mark">W</span> Opening ${escape(doc.filename)}…</div></body></html>`,
  )
  w.document.close()

  try {
    const [{ default: mammoth }, res] = await Promise.all([
      import('mammoth/mammoth.browser'),
      fetch(doc.sourceUrl),
    ])
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ab = await res.arrayBuffer()
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: ab })
    w.document.open()
    w.document.write(docxShell(doc, html))
    w.document.close()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    w.document.open()
    w.document.write(errorShell(doc, msg))
    w.document.close()
  }
}
