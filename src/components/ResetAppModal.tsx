import { useState } from 'react'
import styles from './Modal.module.css'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation for the irreversible "reset app" action.
 *
 * Deliberately not a one-tap button: there is no export or backup yet, so a
 * mis-tap here is unrecoverable. The confirm button stays disabled until the
 * user has acknowledged what goes, which also spells out the consequence
 * rather than relying on the word "reset" to carry it.
 */
export function ResetAppModal({ onConfirm, onCancel }: Props) {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.title}>Reset app</div>

        <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          This erases <strong style={{ color: 'var(--text)' }}>everything</strong> and starts you over at
          setup — every meal, workout and weight reading, plus your name, age,
          height and goal weight.
        </p>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          It cannot be undone, and nothing is backed up anywhere.
        </p>

        <button
          onClick={() => setAcknowledged(a => !a)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 12,
            border: `1px solid ${acknowledged ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
            background: acknowledged ? 'rgba(239,68,68,0.12)' : 'var(--card-bg)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <span
            aria-hidden
            style={{
              flex: '0 0 auto',
              width: 20,
              height: 20,
              borderRadius: 6,
              border: `1.5px solid ${acknowledged ? '#f87171' : 'var(--border)'}`,
              background: acknowledged ? '#f87171' : 'transparent',
              color: '#1a0505',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {acknowledged ? '✓' : ''}
          </span>
          I understand this permanently deletes my data
        </button>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!acknowledged}
            style={{
              flex: 2,
              padding: '0.75rem',
              borderRadius: 12,
              border: 'none',
              background: acknowledged ? '#dc2626' : 'rgba(239,68,68,0.18)',
              color: acknowledged ? '#fff' : 'rgba(248,113,113,0.5)',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
            }}
          >
            Erase everything
          </button>
        </div>
      </div>
    </div>
  )
}
