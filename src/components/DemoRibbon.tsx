import { makeStyles, mergeClasses, tokens, Badge } from '@fluentui/react-components'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from './Avatar'
import { PERSONAS } from '../personas/personas'
import { useWorkflow } from '../workflow/WorkflowContext'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    background:
      'linear-gradient(90deg, #1F1F2E 0%, #2A2A3E 50%, #1F1F2E 100%)',
    color: '#ffffff',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  label: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginRight: '4px',
  },
  pillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px 6px 6px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    lineHeight: '16px',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
    ':hover': {
      border: '1px solid rgba(255,255,255,0.32)',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
  },
  pillActive: {
    border: '1px solid #ffffff',
    backgroundColor: '#ffffff',
    color: '#1F1F2E',
    fontWeight: tokens.fontWeightSemibold,
    ':hover': {
      border: '1px solid #ffffff',
      backgroundColor: '#ffffff',
    },
  },
  pillFlash: {
    border: '1px solid #ffffff',
    backgroundColor: '#ffffff',
    color: '#1F1F2E',
    boxShadow: '0 0 0 3px rgba(255,255,255,0.35), 0 0 20px rgba(255,255,255,0.7)',
  },
  pillContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.1,
  },
  pillName: { fontSize: '13px' },
  pillRole: {
    fontSize: '10px',
    fontWeight: tokens.fontWeightRegular,
    opacity: 0.75,
    marginTop: '1px',
  },
  spacer: { flex: 1 },
  helper: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
  },
})

export function DemoRibbon() {
  const styles = useStyles()
  const { perspective, setPerspective } = useWorkflow()
  const [flashPersona, setFlashPersona] = useState<string | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const previousPerspective = useRef(perspective)

  useEffect(() => {
    if (previousPerspective.current === perspective) return
    previousPerspective.current = perspective

    setFlashPersona(perspective)
    setFlashOn(true)
    let ticks = 0
    const interval = window.setInterval(() => {
      ticks += 1
      setFlashOn((v) => !v)
      if (ticks >= 5) {
        window.clearInterval(interval)
        setFlashOn(false)
        setFlashPersona(null)
      }
    }, 110)

    return () => window.clearInterval(interval)
  }, [perspective])

  return (
    <div className={styles.root} role="toolbar" aria-label="Demo perspective">
      <span className={styles.label}>Demo · Perspective</span>
      <div className={styles.pillRow}>
        {PERSONAS.map((p) => {
          const active = p.id === perspective
          return (
            <button
              key={p.id}
              type="button"
              className={mergeClasses(
                styles.pill,
                active && styles.pillActive,
                flashPersona === p.id && flashOn && styles.pillFlash,
              )}
              onClick={() => setPerspective(p.id, true)}
              aria-pressed={active}
            >
              <Avatar
                kind="person"
                initials={p.initials}
                color={p.avatarColor}
                size={24}
              />
              <span className={styles.pillContent}>
                <span className={styles.pillName}>{p.name}</span>
                <span className={styles.pillRole}>{p.perspectiveLabel}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className={styles.spacer} />
      <Badge appearance="tint" color="informative" size="small">
        Pacific Polymer · SG · ACRA
      </Badge>
      <span className={styles.helper}>Auto-advances · click to jump</span>
    </div>
  )
}
