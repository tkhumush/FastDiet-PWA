import { useEffect, useRef, useState } from 'react'

interface Props {
  now?: number
  goal?: number
}

const W = 380
const H = 250
const PL = 40   // plot left (room for y labels)
const PR = 372  // plot right
const PT = 20   // plot top
const PB = 200  // plot bottom (x labels below)
const V_MIN = 64
const V_MAX = 81

const xFor = (t: number) => PL + t * (PR - PL)
const yFor = (v: number) => PB - ((v - V_MIN) / (V_MAX - V_MIN)) * (PB - PT)

// Smootherstep — flat at both ends, so the curve eases out of "now" and
// settles into "goal".
function smoother(u: number) {
  const c = Math.max(0, Math.min(1, u))
  return c * c * c * (c * (6 * c - 15) + 10)
}

const GUIDE = 'rgba(118,178,232,0.55)'
const GRID = 'rgba(255,255,255,0.06)'
const LABEL = 'rgba(244,248,248,0.45)'

const X_GRID: { t: number; label: string }[] = [
  { t: 0.36, label: 'Dec 2026' },
  { t: 0.68, label: 'Jun 2027' },
  { t: 0.98, label: '…' },
]

// Animated "BMR Journey": your current burn rate easing down to your
// goal-weight burn rate. The green/teal line draws in when scrolled into view.
export function BmrJourneyChart({ now = 78, goal = 70 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const N = 64
  const pts: [number, number][] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const v = now - (now - goal) * smoother((t - 0.08) / 0.8)
    pts.push([xFor(t), yFor(v)])
  }
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${PR} ${PB} L${PL} ${PB} Z`
  const endY = yFor(goal)

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="bmr-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E9B97" />
            <stop offset="55%" stopColor="#4CD9D2" />
            <stop offset="100%" stopColor="#7BEAE3" />
          </linearGradient>
          <linearGradient id="bmr-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CD9D2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4CD9D2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines + y labels */}
        {[65, 70, 75, 80].map(v => (
          <g key={v}>
            <line x1={PL} y1={yFor(v)} x2={PR} y2={yFor(v)} stroke={GRID} strokeWidth={1} />
            <text x={PL - 8} y={yFor(v) + 4} textAnchor="end" fontSize={11} fill={LABEL}>{v}</text>
          </g>
        ))}

        {/* Vertical gridlines + x labels */}
        {X_GRID.map(g => (
          <g key={g.label}>
            <line x1={xFor(g.t)} y1={PT} x2={xFor(g.t)} y2={PB} stroke={GRID} strokeDasharray="3 4" strokeWidth={1} />
            <text x={xFor(g.t)} y={PB + 22} textAnchor="middle" fontSize={11.5} fill={LABEL}>{g.label}</text>
          </g>
        ))}

        {/* Now / Goal guide lines */}
        <line x1={PL} y1={yFor(now)} x2={PR} y2={yFor(now)} stroke={GUIDE} strokeDasharray="6 5" strokeWidth={1.4} />
        <text x={PL + 2} y={yFor(now) - 8} fontSize={12} fontWeight={600} fill="rgba(244,248,248,0.7)">
          Now {now} cal/hr
        </text>
        <line x1={PL} y1={endY} x2={PR} y2={endY} stroke={GUIDE} strokeDasharray="6 5" strokeWidth={1.4} />
        <text x={PL + 2} y={endY - 8} fontSize={12} fontWeight={600} fill="rgba(244,248,248,0.7)">
          Goal {goal} cal/hr
        </text>

        {/* Area + animated line */}
        <path
          d={area}
          fill="url(#bmr-fill)"
          style={{ opacity: inView ? 1 : 0, transition: 'opacity 1.1s ease 1.1s' }}
        />
        <path
          d={line}
          fill="none"
          stroke="url(#bmr-line)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            filter: 'drop-shadow(0 0 7px rgba(76,217,210,0.5))',
            strokeDasharray: 1,
            strokeDashoffset: inView ? 0 : 1,
            transition: 'stroke-dashoffset 2.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* End marker */}
        <circle
          cx={PR}
          cy={endY}
          r={5}
          fill="#FFFFFF"
          style={{
            opacity: inView ? 1 : 0,
            transition: 'opacity 0.4s ease 2s',
            filter: 'drop-shadow(0 0 6px rgba(76,217,210,0.9))',
          }}
        />
      </svg>
    </div>
  )
}
