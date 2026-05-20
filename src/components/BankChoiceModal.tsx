import styles from './Modal.module.css'
import bankStyles from './BankChoice.module.css'

interface Props {
  bankBalance: number
  onUsBank: () => void
  onMelt: () => void
  onCancel: () => void
}

export function BankChoiceModal({ bankBalance, onUsBank, onMelt, onCancel }: Props) {
  const lbs = bankBalance / 3500

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={bankStyles.hero}>
          <span className={bankStyles.icon}>💧</span>
          <p className={bankStyles.balance}>+{Math.round(bankBalance)} cal banked</p>
          <p className={bankStyles.sub}>You've burned more than you loaded.</p>
        </div>

        <div className={bankStyles.options}>
          <button className={bankStyles.option} onClick={onUsBank}>
            <strong>→ Use my bank</strong>
            <span>Banked calories absorb the cost of this meal. Any leftover stays in the bank.</span>
          </button>
          <button className={bankStyles.option} onClick={onMelt}>
            <strong>💧 Melt it away</strong>
            <span>Record {lbs.toFixed(3)} lbs toward your cumulative milestone. Bank stays active.</span>
          </button>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
