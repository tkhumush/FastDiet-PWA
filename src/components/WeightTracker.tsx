import { useState, useMemo } from 'react'
import type { WeightSample, UserProfile, Units } from '../types'
import { LightningTipModal } from './LightningTipModal'
import { Chip } from './shared/Chip'
import { Slider } from './shared/Slider'
import { ScrubberCard } from './shared/ScrubberCard'
import { Eyebrow } from './shared/Eyebrow'

interface Props {
  weights: WeightSample[]
  profile: UserProfile
  onAdd: (sample: WeightSample) => void
  onDelete: (id: string) => void
  onResetMelt: () => void
  onBack: () => void
  saveProfile?: (profile: UserProfile) => void
}

const TK = {
  bg: 'radial-gradient(120% 60% at 50% -10%, rgba(76,217,210,0.20), rgba(76,217,210,0.03) 38%, transparent 65%), radial-gradient(120% 60% at 50% 110%, rgba(240,138,110,0.10), transparent 60%), #07111A',
  text: '#F4F8F8',
  muted: 'rgba(244,248,248,0.55)',
  dim: 'rgba(244,248,248,0.32)',
  hairline: 'rgba(255,255,255,0.07)',
  teal: '#4CD9D2',
  coral: '#F08A6E',
}

type Range = '1M' | '3M' | '6M' | '1Y' | 'All'

function cutoffDate(range: Range): Date | null {
  const d = new Date()
  if (range === '1M') { d.setMonth(d.getMonth() - 1); return d }
  if (range === '3M') { d.setMonth(d.getMonth() - 3); return d }
  if (range === '6M') { d.setMonth(d.getMonth() - 6); return d }
  if (range === '1Y') { d.setFullYear(d.getFullYear() - 1); return d }
  return null
}

function displayWeight(kg: number, units: Units): string {
  if (units === 'metric') return `${kg.toFixed(1)} kg`
  return `${(kg * 2.20462).toFixed(1)} lb`
}

interface ChartPoint {
  v: number
  date: Date
  label: string
}

interface Projection {
  endDate: Date
  endVal: number
  reachesTarget: boolean
}

// Fit a linear trend to recent samples and project forward to the target.
// Returns null when a projection wouldn't be meaningful (no trend, already at
// the target, or trending away from it). Values are in display units.
function projectToTarget(data: ChartPoint[], target: number): Projection | null {
  const lastMs = data[data.length - 1].date.getTime()
  const lastVal = data[data.length - 1].v

  // Prefer the last 4 weeks of samples; fall back to everything if too sparse.
  const windowMs = 28 * 86_400_000
  let recent = data.filter(d => lastMs - d.date.getTime() <= windowMs)
  if (recent.length < 2) recent = data

  // Least-squares slope of value over days.
  const baseMs = recent[0].date.getTime()
  const xs = recent.map(d => (d.date.getTime() - baseMs) / 86_400_000)
  const ys = recent.map(d => d.v)
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  if (den === 0) return null // all samples share a date — no trend

  const slope = num / den // display units per day
  const diff = target - lastVal
  if (Math.abs(diff) < 0.1) return null // already at the target

  const daysToTarget = diff / slope
  if (!Number.isFinite(daysToTarget) || daysToTarget <= 0) return null // flat or moving away

  const horizonDays = Math.min(daysToTarget, 90) // cap distant targets at a 90-day horizon
  const reachesTarget = daysToTarget <= 90
  const endVal = reachesTarget ? target : lastVal + slope * horizonDays
  const endDate = new Date(lastMs + horizonDays * 86_400_000)
  return { endDate, endVal, reachesTarget }
}

function MiniChart({ data, target, height = 150 }: { data: ChartPoint[]; target: number; height?: number }) {
  if (data.length < 2) {
    return (
      <div
        style={{
          height: height + 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: TK.dim,
          fontSize: 13,
        }}
      >
        Log a few readings to see your trend.
      </div>
    )
  }
  const w = 354
  // Bound the Y-axis tightly to the logged data (display units) so small
  // changes stay visible. The goal line may fall outside this range when the
  // target is far from current weight — that's acceptable.
  const dataValues = data.map(d => d.v)
  const yMin = Math.min(...dataValues) - 3
  const yMax = Math.max(...dataValues) + 3
  const yRange = yMax - yMin
  const toY = (v: number) => height - ((v - yMin) / yRange) * height

  const proj = projectToTarget(data, target)

  // Time-based X axis so the projection can extend past the last reading. When
  // every sample shares a date (zero span) fall back to even index spacing.
  const tMin = data[0].date.getTime()
  const lastMs = data[data.length - 1].date.getTime()
  const tMax = proj ? Math.max(lastMs, proj.endDate.getTime()) : lastMs
  const span = tMax - tMin
  const toX = (ms: number, i: number) =>
    span > 0 ? ((ms - tMin) / span) * w : (i / (data.length - 1)) * w

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.date.getTime(), i)} ${toY(d.v)}`).join(' ')
  const lastX = toX(lastMs, data.length - 1)
  const lastY = toY(data[data.length - 1].v)
  const areaPath = linePath + ` L ${lastX} ${height} L 0 ${height} Z`
  const targetY = toY(target)

  const projEndX = proj ? toX(proj.endDate.getTime(), data.length - 1) : 0
  const projEndY = proj ? toY(proj.endVal) : 0
  const projLabelY = Math.max(12, Math.min(height - 4, projEndY - 10))

  return (
    <svg
      viewBox={`0 0 ${w} ${height + 30}`}
      width="100%"
      height={height + 30}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="wf-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4CD9D2" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4CD9D2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wf-chart-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E9B97" />
          <stop offset="60%" stopColor="#4CD9D2" />
          <stop offset="100%" stopColor="#7BEAE3" />
        </linearGradient>
      </defs>
      <line
        x1={0}
        y1={targetY}
        x2={w}
        y2={targetY}
        stroke="rgba(255,255,255,0.18)"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <text
        x={w - 4}
        y={targetY - 6}
        textAnchor="end"
        fill="rgba(244,248,248,0.4)"
        fontSize={10}
        fontWeight={600}
        letterSpacing="0.04em"
      >
        GOAL {target.toFixed(1)}
      </text>
      <path d={areaPath} fill="url(#wf-chart-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="url(#wf-chart-line)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 8px rgba(76,217,210,0.55))' }}
      />
      {proj && (
        <>
          <line
            x1={lastX}
            y1={lastY}
            x2={projEndX}
            y2={projEndY}
            stroke={TK.coral}
            strokeOpacity={0.7}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
          <circle cx={projEndX} cy={projEndY} r={3.5} fill={TK.coral} />
          {proj.reachesTarget && (
            <text
              x={Math.min(projEndX, w - 4)}
              y={projLabelY}
              textAnchor="end"
              fill={TK.coral}
              fontSize={10}
              fontWeight={700}
              letterSpacing="0.02em"
            >
              Target ~{proj.endDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </text>
          )}
        </>
      )}
      <circle cx={lastX} cy={lastY} r={9} fill="rgba(76,217,210,0.18)" />
      <circle
        cx={lastX}
        cy={lastY}
        r={4.5}
        fill="#FFFFFF"
        style={{ filter: 'drop-shadow(0 0 6px rgba(76,217,210,0.8))' }}
      />
      <text x={0} y={height + 22} fill="rgba(244,248,248,0.32)" fontSize={9.5}>
        {data[0]?.label}
      </text>
      <text x={w} y={height + 22} textAnchor="end" fill="rgba(244,248,248,0.32)" fontSize={9.5}>
        {proj ? proj.endDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : data[data.length - 1]?.label}
      </text>
    </svg>
  )
}

type ActiveChip = 'current' | 'target' | null

export function WeightTracker({ weights, profile, onAdd, onDelete: _onDelete, onResetMelt, onBack, saveProfile }: Props) {
  const [range, setRange] = useState<Range>('3M')
  const [active, setActive] = useState<ActiveChip>(null)
  const [pendingKg, setPendingKg] = useState<number | null>(null)
  const [pendingTargetKg, setPendingTargetKg] = useState<number | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [tipLbsLost, setTipLbsLost] = useState(0)

  // Weights are stored newest-first in the array
  const sortedAsc = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const latestKg = weights[0]?.kg ?? profile.targetWeightKg

  const filtered = useMemo(() => {
    const cut = cutoffDate(range)
    return cut ? sortedAsc.filter(s => new Date(s.date) >= cut) : sortedAsc
  }, [sortedAsc, range])

  const chartData: ChartPoint[] = filtered.map(s => {
    const d = new Date(s.date)
    return {
      v: profile.units === 'metric' ? +s.kg.toFixed(1) : +(s.kg * 2.20462).toFixed(1),
      date: d,
      label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    }
  })

  const targetChartVal = profile.units === 'metric'
    ? profile.targetWeightKg
    : profile.targetWeightKg * 2.20462

  // Effective values for sentence chips
  const currentKgDisplay = active === 'current' ? (pendingKg ?? latestKg) : latestKg
  const targetKgDisplay = active === 'target' ? (pendingTargetKg ?? profile.targetWeightKg) : profile.targetWeightKg
  const toGoKg = Math.max(0, currentKgDisplay - targetKgDisplay)

  // Anchor the "log reading" slider to a tight window around the latest weight
  // so each step is easy to hit (±15 lb imperial, ±7 kg metric). The slider
  // operates in kg, so derive the window in kg from a stable reference.
  const logWindowKg = profile.units === 'metric' ? 7 : 15 / 2.20462
  const currentSliderMin = +(latestKg - logWindowKg).toFixed(1)
  const currentSliderMax = +(latestKg + logWindowKg).toFixed(1)

  function openCurrent() { setPendingKg(latestKg); setActive('current') }
  function openTarget() { setPendingTargetKg(profile.targetWeightKg); setActive('target') }
  function closeAll() { setActive(null); setPendingKg(null); setPendingTargetKg(null) }

  function logReading() {
    const kg = +((pendingKg ?? latestKg)).toFixed(1)
    // Check for weight loss vs most recent entry
    const previousKg = weights[0]?.kg
    if (previousKg !== undefined && weights.length >= 1) {
      const lbsLost = (previousKg - kg) * 2.20462
      const wholeLbs = Math.floor(lbsLost)
      if (wholeLbs >= 1) setTipLbsLost(wholeLbs)
    }
    onAdd({ id: crypto.randomUUID(), date: new Date().toISOString(), kg })
    closeAll()
  }

  function saveTarget() {
    if (!saveProfile) {
      closeAll()
      return
    }
    saveProfile({ ...profile, targetWeightKg: pendingTargetKg ?? profile.targetWeightKg })
    closeAll()
  }

  const meltedLbs = profile.cumulativeBankedCalories / 3500

  let scrubber: React.ReactNode = null
  if (active === 'current') {
    scrubber = (
      <ScrubberCard
        label="Log new reading"
        displayValue={displayWeight(currentKgDisplay, profile.units)}
        visible
        onClose={closeAll}
        primary={{ label: 'Log reading', onClick: logReading }}
      >
        <Slider
          value={currentKgDisplay}
          min={currentSliderMin}
          max={currentSliderMax}
          step={0.1}
          onChange={n => setPendingKg(+n.toFixed(1))}
          showRange
        />
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 11.5,
            color: TK.dim,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          A new entry will be added to your history.
        </p>
      </ScrubberCard>
    )
  } else if (active === 'target') {
    scrubber = (
      <ScrubberCard
        label="Target weight"
        displayValue={displayWeight(targetKgDisplay, profile.units)}
        visible
        onClose={closeAll}
        primary={{ label: 'Save goal', onClick: saveTarget }}
      >
        <Slider
          value={targetKgDisplay}
          min={30}
          max={200}
          step={0.5}
          onChange={n => setPendingTargetKg(n)}
          showRange
        />
      </ScrubberCard>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        background: TK.bg,
        color: TK.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ minHeight: '100dvh', overflow: 'auto' }}>
        <div
          style={{
            minHeight: '100dvh',
            paddingTop: 60,
            paddingBottom: scrubber ? 280 : 60,
            paddingLeft: 24,
            paddingRight: 24,
            boxSizing: 'border-box',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              gap: 8,
            }}
          >
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: TK.muted,
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              ‹ Dashboard
            </button>
            <Eyebrow color={TK.muted} size={11}>Weight</Eyebrow>
            <button
              onClick={openCurrent}
              style={{
                background: 'rgba(76,217,210,0.10)',
                border: '1px solid rgba(76,217,210,0.35)',
                color: TK.teal,
                fontSize: 12.5,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            >
              + Log
            </button>
          </div>

          {/* Sentence */}
          <div style={{ marginBottom: 22 }}>
            <Eyebrow size={11}>You're at</Eyebrow>
            <div
              style={{
                marginTop: 10,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.55,
                letterSpacing: '-0.012em',
                color: TK.muted,
              }}
            >
              <Chip active={active === 'current'} onClick={openCurrent}>
                {displayWeight(currentKgDisplay, profile.units)}
              </Chip>
              &nbsp;today,
              {toGoKg > 0 ? (
                <>
                  {' '}still{' '}
                  <span style={{ color: TK.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {displayWeight(toGoKg, profile.units)}
                  </span>{' '}
                  from
                </>
              ) : (
                <> already at</>
              )}
              &nbsp;your goal of&nbsp;
              <Chip active={active === 'target'} onClick={openTarget}>
                {displayWeight(targetKgDisplay, profile.units)}
              </Chip>
              .
            </div>
          </div>

          {/* Range pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {(['1M', '3M', '6M', '1Y', 'All'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 8,
                  background: range === r ? 'rgba(76,217,210,0.15)' : 'transparent',
                  border: `1px solid ${range === r ? 'rgba(76,217,210,0.4)' : TK.hairline}`,
                  color: range === r ? TK.teal : TK.muted,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div
            style={{
              padding: '14px 8px 8px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${TK.hairline}`,
              marginBottom: 18,
            }}
          >
            <MiniChart data={chartData} target={targetChartVal} height={150} />
          </div>

          {/* Melted card */}
          {meltedLbs > 0 && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(76,217,210,0.10), rgba(240,138,110,0.06))',
                border: '1px solid rgba(76,217,210,0.22)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #4CD9D2, #1E9B97)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: '0 4px 14px rgba(76,217,210,0.35)',
                  flexShrink: 0,
                }}
              >
                💧
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: TK.muted,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color: TK.text,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {meltedLbs.toFixed(2)} lbs
                </span>
                &nbsp;melted from converted surplus.
              </div>
              {confirmReset ? (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setConfirmReset(false)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${TK.hairline}`,
                      color: TK.muted,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onResetMelt(); setConfirmReset(false) }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(240,138,110,0.15)',
                      border: '1px solid rgba(240,138,110,0.45)',
                      color: TK.coral,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  aria-label="Reset melted total"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${TK.hairline}`,
                    color: TK.muted,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* History */}
          <div>
            <Eyebrow color={TK.muted} size={11}>History</Eyebrow>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
              {weights.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: TK.dim,
                    border: `1px dashed ${TK.hairline}`,
                    borderRadius: 16,
                    marginTop: 10,
                  }}
                >
                  No weight readings yet. Tap + Log to start.
                </div>
              ) : (
                weights.slice(0, 6).map((p, i, arr) => {
                  const ms = Date.now() - new Date(p.date).getTime()
                  const days = Math.floor(ms / 86_400_000)
                  const when =
                    days < 1 ? 'Today' :
                    days === 1 ? 'Yesterday' :
                    new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        padding: '12px 4px',
                        borderBottom: i < arr.length - 1 ? `1px solid ${TK.hairline}` : 'none',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 17,
                          color: TK.text,
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {displayWeight(p.kg, profile.units)}
                      </span>
                      <span style={{ fontSize: 12, color: TK.dim }}>{when}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {scrubber && (
        <div
          style={{
            position: 'fixed',
            bottom: 50,
            left: 24,
            right: 24,
            maxWidth: 432,
            margin: '0 auto',
            zIndex: 10,
          }}
        >
          {scrubber}
        </div>
      )}

      {tipLbsLost > 0 && (
        <LightningTipModal
          lbsLost={tipLbsLost}
          onDismiss={() => setTipLbsLost(0)}
        />
      )}
    </div>
  )
}
