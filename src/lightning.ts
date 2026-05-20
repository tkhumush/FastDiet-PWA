const LIGHTNING_ADDRESS = 'tkay_88@getalby.com'
export const SATS_PER_POUND = 1000

declare global {
  interface Window {
    webln?: {
      enable: () => Promise<void>
      sendPayment: (paymentRequest: string) => Promise<{ preimage: string }>
    }
  }
}

/** Resolve a Lightning Address to a BOLT11 invoice for the given sat amount. */
export async function fetchInvoice(sats: number): Promise<string> {
  const [username, domain] = LIGHTNING_ADDRESS.split('@')
  const lnurlRes = await fetch(`https://${domain}/.well-known/lnurlp/${username}`)
  if (!lnurlRes.ok) throw new Error('Could not reach payment endpoint')
  const { callback } = await lnurlRes.json()

  const msats = sats * 1000
  const invoiceRes = await fetch(`${callback}?amount=${msats}`)
  if (!invoiceRes.ok) throw new Error('Could not fetch invoice')
  const { pr } = await invoiceRes.json()
  if (!pr) throw new Error('No invoice returned')
  return pr
}

/** Pay via WebLN if a compatible wallet extension is present. */
export async function payWithWebLN(invoice: string): Promise<boolean> {
  if (!window.webln) return false
  try {
    await window.webln.enable()
    await window.webln.sendPayment(invoice)
    return true
  } catch {
    return false
  }
}

export function hasWebLN(): boolean {
  return typeof window !== 'undefined' && !!window.webln
}
