import { useEffect, useRef } from 'react'

interface Props {
  fillFraction: number
  inBank: boolean
}

export function WaterFill({ fillFraction, inBank }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  // Refs let the animation loop read current props without ever restarting
  const fillRef = useRef(fillFraction)
  const inBankRef = useRef(inBank)

  // Sync props into refs — no animation restart, no flicker
  useEffect(() => {
    fillRef.current = fillFraction
    inBankRef.current = inBank
  }, [fillFraction, inBank])

  // Animation loop starts once and runs for the lifetime of the component
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio
      canvas!.height = canvas!.offsetHeight * devicePixelRatio
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    function draw(ts: number) {
      const inBank = inBankRef.current
      const fillFraction = fillRef.current

      const w = canvas!.width
      const h = canvas!.height
      ctx.clearRect(0, 0, w, h)

      const phase = (ts / 1000) * 1.1
      const f = inBank ? 0 : Math.max(0, Math.min(1, fillFraction))
      const baseY = h * (1 - f)
      const amplitude = h * 0.022
      const wavelength = w * 0.65
      const hue = inBank ? 210 : 216 * (1 - f)

      function wave(amp: number, wl: number, phaseOff: number, alpha: number) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y = baseY + amp * Math.sin((2 * Math.PI * x) / wl + phase + phaseOff)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.closePath()
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`
        ctx.fill()
      }

      wave(amplitude, wavelength, 0, 0.22)
      wave(amplitude * 0.65, wavelength * 0.78, 1.3, 0.15)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, []) // Empty — runs once, reads live values from refs

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
