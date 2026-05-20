import { useState, useEffect } from 'react'
import { fetchInvoice, payWithWebLN, hasWebLN, SATS_PER_POUND } from '../lightning'
import styles from './LightningTipModal.module.css'

interface Props {
  lbsLost: number
  onDismiss: () => void
}

type State = 'loading' | 'ready' | 'paying' | 'paid' | 'error'

export function LightningTipModal({ lbsLost, onDismiss }: Props) {
  const sats = lbsLost * SATS_PER_POUND
  const [invoice, setInvoice] = useState<string | null>(null)
  const [state, setState] = useState<State>('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchInvoice(sats)
      .then(pr => { setInvoice(pr); setState('ready') })
      .catch(() => setState('error'))
  }, [sats])

  async function handleWebLN() {
    if (!invoice) return
    setState('paying')
    const ok = await payWithWebLN(invoice)
    setState(ok ? 'paid' : 'ready')
  }

  function handleCopy() {
    if (!invoice) return
    navigator.clipboard.writeText(invoice)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {state === 'paid' ? (
          <div className={styles.paidState}>
            <span className={styles.paidIcon}>⚡</span>
            <h2>Payment sent!</h2>
            <p>Thanks for the {sats.toLocaleString()} sats. Keep going!</p>
            <button className={styles.doneBtn} onClick={onDismiss}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.hero}>
              <span className={styles.trophy}>🏆</span>
              <h2 className={styles.title}>You lost {lbsLost} lb{lbsLost !== 1 ? 's' : ''}!</h2>
              <p className={styles.sub}>Want to send a tip to celebrate?</p>
            </div>

            <div className={styles.amountCard}>
              <span className={styles.bolt}>⚡</span>
              <div>
                <p className={styles.sats}>{sats.toLocaleString()} sats</p>
                <p className={styles.rate}>{SATS_PER_POUND.toLocaleString()} sats × {lbsLost} lb{lbsLost !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {state === 'loading' && (
              <div className={styles.loadingRow}>
                <div className={styles.spinner} />
                <span>Generating invoice…</span>
              </div>
            )}

            {state === 'error' && (
              <div className={styles.errorBox}>
                <p>Could not reach the payment endpoint.</p>
                <p className={styles.errorAddress}>You can pay manually to:<br /><strong>tkay_88@getalby.com</strong></p>
              </div>
            )}

            {(state === 'ready' || state === 'paying') && invoice && (
              <div className={styles.actions}>
                {hasWebLN() && (
                  <button
                    className={styles.webLNBtn}
                    onClick={handleWebLN}
                    disabled={state === 'paying'}
                  >
                    {state === 'paying' ? (
                      <><div className={styles.spinnerSm} /> Paying…</>
                    ) : (
                      <>⚡ Pay with wallet</>
                    )}
                  </button>
                )}

                <a
                  className={styles.lightningLink}
                  href={`lightning:${invoice}`}
                  onClick={onDismiss}
                >
                  ⚡ Open in Lightning wallet
                </a>

                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? '✓ Copied!' : 'Copy invoice'}
                </button>
              </div>
            )}

            <button className={styles.laterBtn} onClick={onDismiss}>Maybe later</button>
          </>
        )}
      </div>
    </div>
  )
}
