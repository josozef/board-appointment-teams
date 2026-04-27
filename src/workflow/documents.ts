/**
 * Document model for the workflow's Files surface.
 *
 * Documents are *derived* from the workflow state (no separate slice) so the
 * Files tab and the inline file chips both stay in sync with the chat.
 *
 * `openDocument` simulates "opening in native software" by popping a styled
 * HTML preview in a new tab — Word-shell for .docx, Acrobat-shell for .pdf.
 */
import type { AppointmentWorkflow } from './types'
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
  /** Renderable body (plain text or simple HTML) for the preview. */
  body: string
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

/** Compute the document list visible in the Files tab from the current state. */
export function selectDocuments(workflow: AppointmentWorkflow): WorkflowDocument[] {
  const docs: WorkflowDocument[] = []
  const consent = workflow.consentDocument
  const resolution = workflow.boardResolution
  const appointee = workflow.selectedCandidate
  const filingDone =
    workflow.steps.find((s) => s.id === 'filing')?.status === 'completed'

  if (appointee) {
    let status: DocumentStatus = 'draft'
    if (consent.signedAt) status = 'signed'
    else if (consent.sent) status = 'sent'
    const lastEdit = consent.signedAt ?? consent.sentAt ?? workflow.updatedAt
    docs.push({
      id: 'doc-form-45',
      filename: `Form 45 — Consent to Act — ${appointee.name}.docx`,
      kind: 'docx',
      title: 'Form 45 — Consent to Act as Director',
      subtitle: `Companies Act s.145(5) · ${workflow.entity.name}`,
      modifiedBy: status === 'signed' ? appointee.name : AGENT_NAME,
      modifiedAt: lastEdit,
      sizeBytes: 24_000,
      status,
      body: consent.content,
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
      filename: `Board Resolution — Director Appointment — Pacific Polymer.docx`,
      kind: 'docx',
      title: 'Board Resolution — Director Appointment',
      subtitle: `Acme · Nominating & Governance Committee`,
      modifiedBy: AGENT_NAME,
      modifiedAt: lastEdit,
      sizeBytes: 32_000,
      status,
      body: resolution.content,
    })
  }

  if (filingDone) {
    docs.push({
      id: 'doc-acra-receipt',
      filename: `ACRA BizFile+ Receipt — Form 45.pdf`,
      kind: 'pdf',
      title: 'ACRA Filing Receipt',
      subtitle: `BizFile+ · Notification of Change of Director`,
      modifiedBy: 'BizFile+ (ACRA)',
      modifiedAt: workflow.updatedAt,
      sizeBytes: 86_000,
      status: 'filed',
      body: `BIZFILE+ FILING ACKNOWLEDGEMENT
Reference: BIZ-2026-${workflow.id.slice(-6).toUpperCase()}
Filing date: ${formatModified(workflow.updatedAt)}

Filing type: Notification of Change of Director (Form 45)
Entity: ${workflow.entity.name}
UEN: ${workflow.entity.uen}

Outgoing director: ${workflow.departingDirector?.name}
Incoming director: ${appointee?.name ?? '—'}
Effective date: ${workflow.appointmentEffectiveDate ?? '—'}

This electronic acknowledgement confirms successful submission to the Accounting and Corporate Regulatory Authority of Singapore. No further action is required.`,
    })
  }

  return docs
}

const docxShell = (doc: WorkflowDocument) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>${escape(doc.filename)} — Microsoft Word</title>
<style>
  :root { color-scheme: light; }
  html, body { margin: 0; height: 100%; background: #f3f2f1; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; color: #201f1e; }
  .titlebar { background: #185ABD; color: #fff; padding: 6px 12px; font-size: 12px; display: flex; gap: 8px; align-items: center; }
  .titlebar .word-mark { background: #fff; color: #185ABD; font-weight: 700; padding: 2px 6px; border-radius: 2px; font-size: 11px; }
  .ribbon { background: #fff; border-bottom: 1px solid #e1dfdd; padding: 6px 12px; display: flex; gap: 16px; font-size: 12px; color: #605e5c; }
  .ribbon span { padding: 2px 6px; }
  .ribbon .home { color: #201f1e; font-weight: 600; border-bottom: 2px solid #185ABD; }
  .page-wrap { padding: 32px 0; display: flex; justify-content: center; }
  .page { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.08); width: min(720px, calc(100% - 32px)); padding: 72px 80px 96px; font-family: "Cambria", "Georgia", serif; font-size: 11pt; line-height: 1.55; color: #201f1e; }
  h1 { font-size: 18pt; margin: 0 0 4px; font-weight: 700; }
  .subtitle { font-size: 12pt; color: #605e5c; margin-bottom: 24px; }
  p { margin: 0 0 14px; }
  .signature-block { margin-top: 36px; border-top: 1px solid #c8c6c4; padding-top: 18px; font-size: 10pt; color: #605e5c; }
</style>
</head><body>
  <div class="titlebar">
    <span class="word-mark">W</span>
    <span>${escape(doc.filename)}</span>
    <span style="opacity:.7">— Saved</span>
  </div>
  <div class="ribbon">
    <span class="home">Home</span>
    <span>Insert</span><span>Layout</span><span>References</span><span>Review</span><span>View</span>
  </div>
  <div class="page-wrap"><div class="page">
    <h1>${escape(doc.title)}</h1>
    <div class="subtitle">${escape(doc.subtitle)}</div>
    ${doc.body
      .split(/\n{2,}/)
      .map((p) => `<p>${escape(p)}</p>`)
      .join('\n')}
    <div class="signature-block">
      <p><strong>Status:</strong> ${doc.status.toUpperCase()}</p>
      <p><strong>Last modified:</strong> ${escape(formatModified(doc.modifiedAt))} · ${escape(doc.modifiedBy)}</p>
    </div>
  </div></div>
</body></html>`

const pdfShell = (doc: WorkflowDocument) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>${escape(doc.filename)} — Adobe Acrobat</title>
<style>
  :root { color-scheme: light; }
  html, body { margin: 0; height: 100%; background: #4a4a4a; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; color: #f3f3f3; }
  .toolbar { background: #2b2b2b; color: #fff; padding: 8px 16px; font-size: 12px; display: flex; gap: 12px; align-items: center; border-bottom: 1px solid #1a1a1a; }
  .toolbar .acrobat { background: #ec1c24; color: #fff; font-weight: 700; padding: 2px 6px; border-radius: 2px; font-size: 11px; }
  .toolbar .filename { opacity: .9; }
  .page-wrap { padding: 28px 0; display: flex; justify-content: center; }
  .page { background: #fff; color: #1a1a1a; width: min(720px, calc(100% - 32px)); padding: 64px 72px; font-family: "Helvetica Neue", "Arial", sans-serif; font-size: 11pt; line-height: 1.6; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
  h1 { font-size: 16pt; margin: 0 0 4px; }
  .subtitle { color: #666; margin-bottom: 24px; font-size: 11pt; }
  pre { white-space: pre-wrap; font-family: "Helvetica Neue", "Arial", sans-serif; font-size: 11pt; margin: 0; }
  .footer { margin-top: 48px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 9pt; color: #888; }
</style>
</head><body>
  <div class="toolbar">
    <span class="acrobat">PDF</span>
    <span class="filename">${escape(doc.filename)}</span>
    <span style="opacity:.6">— Adobe Acrobat</span>
  </div>
  <div class="page-wrap"><div class="page">
    <h1>${escape(doc.title)}</h1>
    <div class="subtitle">${escape(doc.subtitle)}</div>
    <pre>${escape(doc.body)}</pre>
    <div class="footer">
      Document status: ${doc.status.toUpperCase()} · Last modified ${escape(formatModified(doc.modifiedAt))} · ${escape(doc.modifiedBy)}
    </div>
  </div></div>
</body></html>`

/** Open a previewable, app-themed HTML render of the doc in a new tab. */
export function openDocument(doc: WorkflowDocument) {
  const html = doc.kind === 'docx' ? docxShell(doc) : pdfShell(doc)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'noopener,noreferrer')
  if (!w) {
    // Popup blocked — fall back to a same-tab navigation.
    window.location.href = url
  }
  // Revoke shortly after; the new tab will already have the blob loaded.
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
