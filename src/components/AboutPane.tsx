import { makeStyles, tokens } from '@fluentui/react-components'
import { AGENT_NAME } from '../personas/personas'

const useStyles = makeStyles({
  pane: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#ffffff',
    minHeight: 0,
    padding: '32px 32px 48px',
    color: tokens.colorNeutralForeground1,
  },
  inner: { maxWidth: '720px' },
  title: {
    fontSize: '20px',
    fontWeight: tokens.fontWeightSemibold,
    margin: '0 0 6px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
    marginBottom: '20px',
  },
  section: { marginBottom: '24px' },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '6px',
  },
  body: { fontSize: '13px', lineHeight: '20px', color: tokens.colorNeutralForeground2 },
  list: { margin: '0', paddingLeft: '20px' },
})

export function AboutPane() {
  const styles = useStyles()
  return (
    <section className={styles.pane}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{AGENT_NAME}</h1>
        <div className={styles.subtitle}>
          Board appointment workflow · Diligent Governance app
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>What I do</div>
          <p className={styles.body}>
            I monitor governance triggers — director resignations, term
            expirations, regulatory changes — and route the work to the right
            person in Teams. I prepare draft documents, collect required data,
            run approvals, and file with regulators on your behalf.
          </p>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Permissions</div>
          <ul className={styles.list}>
            <li className={styles.body}>Read your Workday HR roster</li>
            <li className={styles.body}>Read &amp; write Acme entity records</li>
            <li className={styles.body}>Submit filings to ACRA via BizFile+</li>
            <li className={styles.body}>Send messages and files in Teams</li>
          </ul>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Privacy</div>
          <p className={styles.body}>
            All workflow files are saved to this chat's Files tab and to the
            entity's audit trail. Only chat participants can open them.
          </p>
        </div>
      </div>
    </section>
  )
}
