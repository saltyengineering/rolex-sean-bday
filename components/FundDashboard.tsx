'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import styles from './FundDashboard.module.css'

interface Contribution {
  date: string; amount: number; buyPrice: number; note?: string
}
interface QQQData {
  price: number | null; changePct: number | null; error?: boolean
}
interface Props {
  contributions: Contribution[]
  goal: number
  onBack?: () => void
  watchName?: string
  watchRef?: string
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const QUOTES = [
  'Every dollar is a tick closer.',
  'Patience is the rarest luxury.',
  'The best things are worth saving for.',
  'One contribution at a time.',
  'Sean deserves nothing but the best.',
  'Time is the ultimate investment.',
]

const MILESTONES = [
  { pct: 10,  label: '10%',      emoji: '🌱' },
  { pct: 25,  label: 'Quarter',  emoji: '🥂' },
  { pct: 50,  label: 'Halfway',  emoji: '🔥' },
  { pct: 75,  label: '¾ there',  emoji: '🏃' },
  { pct: 100, label: 'Done!',    emoji: '🎉' },
]

const CONFETTI_COLORS = ['#006039','#006039','#C9A84C','#C9A84C','#008f55','#e8c55a','#004d2c']

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.round(p * p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target, duration])
  return val
}

function useConfettiBurst(canvasRef: React.RefObject<HTMLCanvasElement>, trigger: boolean) {
  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const cx = canvas.width / 2, cy = canvas.height * 0.35
    const pieces = Array.from({ length: 90 }, () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      size: 5 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.4 ? 'rect' : 'circle' as 'rect' | 'circle',
      life: 1,
    }))
    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.4
        p.rotation += p.rotSpeed; p.life -= 0.018
        if (p.life <= 0) continue
        alive = true
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }
      if (alive) animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [trigger, canvasRef])
}

export default function FundDashboard({ contributions, goal, onBack, watchName = 'Submariner', watchRef = 'Ref. 124060' }: Props) {
  const [qqq, setQqq] = useState<QQQData>({ price: null, changePct: null })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [monthlyContrib, setMonthlyContrib] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<unknown>(null)

  const fetchQQQ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/qqq')
      const data = await res.json()
      setQqq(data)
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setQqq({ price: null, changePct: null, error: true })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQQQ() }, [fetchQQQ])

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 600)
    return () => clearTimeout(t)
  }, [])

  useConfettiBurst(canvasRef, showConfetti)



  const price = qqq.price ?? 0
  const totalInvested = contributions.reduce((s, c) => s + c.amount, 0)
  const totalShares = contributions.reduce((s, c) => s + c.amount / c.buyPrice, 0)
  const currentValue = price ? totalShares * price : 0
  const gain = currentValue - totalInvested
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0
  const progressPct = Math.min((currentValue / goal) * 100, 100)
  const changePct = qqq.changePct ?? 0

  // Projection based on actual contribution cadence
  const sortedDates = [...contributions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(c => new Date(c.date).getTime())

  let avgIntervalMs = 30 * 24 * 60 * 60 * 1000 // default 1 month if only 1 contribution
  if (sortedDates.length >= 2) {
    const totalSpan = sortedDates[sortedDates.length - 1] - sortedDates[0]
    avgIntervalMs = totalSpan / (sortedDates.length - 1)
  }
  const avgIntervalMonths = avgIntervalMs / (1000 * 60 * 60 * 24 * 30.44)
  const avgContribAmount = totalInvested / Math.max(contributions.length, 1)
  const monthlyGrowthRate = Math.pow(1.153, 1 / 12) - 1

  let projVal = currentValue, projMonths = 0, monthsSinceLastContrib = 0
  if (price && currentValue < goal) {
    while (projVal < goal && projMonths < 600) {
      projVal *= (1 + monthlyGrowthRate)
      monthsSinceLastContrib += 1
      if (monthsSinceLastContrib >= avgIntervalMonths) {
        projVal += avgContribAmount
        monthsSinceLastContrib = 0
      }
      projMonths++
    }
  }

  const projDate = new Date()
  projDate.setMonth(projDate.getMonth() + projMonths)
  const projStr = projDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cadenceDays = Math.round(avgIntervalMs / (1000 * 60 * 60 * 24))
  const cadenceLabel = cadenceDays <= 10 ? 'weekly'
    : cadenceDays <= 20 ? 'bi-weekly'
    : cadenceDays <= 40 ? 'monthly'
    : cadenceDays <= 70 ? 'every 2 months'
    : `every ~${Math.round(cadenceDays / 30)} months`

  // Slider-driven projection
  const effectiveMonthly = monthlyContrib ?? Math.round(avgContribAmount / Math.max(avgIntervalMonths, 1))

  function buildProjection(monthly: number, months = 120) {
    const rate = Math.pow(1.153, 1 / 12) - 1
    const labels: string[] = []
    const values: number[] = []
    const contribLine: number[] = []
    let val = currentValue
    let invested = totalInvested
    const now = new Date()
    for (let m = 0; m <= months; m++) {
      const d = new Date(now)
      d.setMonth(now.getMonth() + m)
      labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
      values.push(Math.round(val))
      contribLine.push(Math.round(invested))
      if (m < months) {
        val = val * (1 + rate) + monthly
        invested += monthly
      }
    }
    return { labels, values, contribLine }
  }

  function projMonthsForMonthly(monthly: number) {
    const rate = Math.pow(1.153, 1 / 12) - 1
    let val = currentValue, m = 0
    while (val < goal && m < 600) { val = val * (1 + rate) + monthly; m++ }
    return m
  }

  const sliderMonths = projMonthsForMonthly(effectiveMonthly)
  const sliderProjDate = new Date()
  sliderProjDate.setMonth(sliderProjDate.getMonth() + sliderMonths)
  const sliderProjStr = sliderProjDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Chart
  useEffect(() => {
    if (!price) return
    const canvas = chartRef.current
    if (!canvas) return
    const monthly = monthlyContrib ?? Math.round(avgContribAmount / Math.max(avgIntervalMonths, 1))
    const { labels, values, contribLine } = buildProjection(monthly)

    const loadChart = async () => {
      if (typeof window === 'undefined') return
      const Chart = (await import('chart.js/auto')).default
      if (chartInstanceRef.current) {
        (chartInstanceRef.current as { destroy(): void }).destroy()
      }
      chartInstanceRef.current = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Projected value',
              data: values,
              borderColor: '#006039',
              backgroundColor: 'rgba(0,96,57,0.06)',
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              tension: 0.4,
            },
            {
              label: 'Total contributed',
              data: contribLine,
              borderColor: '#C9A84C',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ctx.parsed.y == null ? '' : `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 8,
                font: { size: 11, family: 'Inter, sans-serif' },
                color: '#9a9a9a',
              },
              grid: { color: '#f0f0f0' },
            },
            y: {
              ticks: {
                callback: (v) => '$' + Number(v).toLocaleString(),
                font: { size: 11, family: 'Inter, sans-serif' },
                color: '#9a9a9a',
                maxTicksLimit: 6,
              },
              grid: { color: '#f0f0f0' },
            },
          },
          animation: { duration: 400 },
        },
      })
    }
    loadChart()
  }, [price, monthlyContrib, avgContribAmount, avgIntervalMonths, currentValue, totalInvested, goal])

  const countedValue = useCountUp(Math.round(currentValue), 1400)
  const countedInvested = useCountUp(Math.round(totalInvested), 1000)

  // SVG ring
  const R = 88, CIRC = 2 * Math.PI * R
  const dashOffset = CIRC * (1 - progressPct / 100)

  return (
    <main className={styles.main}>
      <h1 className="sr-only">Sean&apos;s Rolex Fund Dashboard</h1>
      <canvas ref={canvasRef} className={styles.confettiCanvas} aria-hidden="true" />

      <div className={styles.topBar} />
      <div className={styles.botBar} />

      {onBack && (
        <button className={styles.backBtn} onClick={onBack}>← back</button>
      )}

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.eyebrow}>Rolex · Since 1905</p>
          <h2 className={styles.heroTitle}>Sean&apos;s<br /><span className={styles.green}>Rolex Fund</span></h2>
          <p className={styles.heroSub}>{watchName} · {watchRef}</p>

          <div className={styles.quoteWrap}>
            <p className={styles.quote} key={quoteIdx}>{QUOTES[quoteIdx]}</p>
          </div>

          <div className={styles.qqqBar}>
            <span className={styles.ticker}>QQQ</span>
            <span className={styles.qqqPrice}>{loading ? '—' : qqq.price ? fmt(qqq.price) : 'n/a'}</span>
            {!loading && qqq.price && (
              <span className={`${styles.change} ${changePct >= 0 ? styles.up : styles.down}`}>
                {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            )}
            {lastUpdated && <span className={styles.updated}>· {lastUpdated}</span>}
            <button className={styles.refreshBtn} onClick={fetchQQQ} aria-label="Refresh">↻</button>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.ringWrap}>
            <svg width="220" height="220" viewBox="0 0 220 220" aria-label={`${progressPct.toFixed(1)}% of goal reached`}>
              <circle cx="110" cy="110" r={R} fill="none" stroke="#e8e8e8" strokeWidth="14" />
              <circle
                cx="110" cy="110" r={R}
                fill="none"
                stroke="#006039"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 110 110)"
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}
              />
              <circle cx="110" cy="110" r="66" fill="none" stroke="#C9A84C" strokeWidth="1" strokeDasharray="3 5" />
              <text x="110" y="122" textAnchor="middle" fontSize="32" fontWeight="500" fill="#1a1a1a" fontFamily="Inter, sans-serif">{progressPct.toFixed(0)}%</text>
              <text x="110" y="142" textAnchor="middle" fontSize="11" fill="#C9A84C" fontFamily="Inter, sans-serif">of {fmtInt(goal)}</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Big stats */}
      <section className={styles.statsRow}>
        <div className={styles.bigStat}>
          <div className={styles.bigStatLabel}>Current value</div>
          <div className={`${styles.bigStatVal} ${styles.green}`}>
            ${price ? countedValue.toLocaleString() : '—'}
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.bigStat}>
          <div className={styles.bigStatLabel}>Total invested</div>
          <div className={styles.bigStatVal}>${countedInvested.toLocaleString()}</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.bigStat}>
          <div className={styles.bigStatLabel}>Total gain</div>
          <div className={`${styles.bigStatVal} ${price ? (gain >= 0 ? styles.gainUp : styles.gainDown) : ''}`}>
            {price ? `${gain >= 0 ? '+' : ''}${fmt(gain)}` : '—'}
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.bigStat}>
          <div className={styles.bigStatLabel}>Return</div>
          <div className={`${styles.bigStatVal} ${price ? (gainPct >= 0 ? styles.gainUp : styles.gainDown) : ''}`}>
            {price ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : '—'}
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.bigStat}>
          <div className={styles.bigStatLabel}>Shares held</div>
          <div className={styles.bigStatVal}>{totalShares.toFixed(4)}</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.bigStat}>
          <div className={styles.bigStatLabel}>Remaining</div>
          <div className={styles.bigStatVal}>{price ? fmtInt(Math.max(goal - currentValue, 0)) : '—'}</div>
        </div>
      </section>

      {/* Milestones */}
      <section className={styles.milestones}>
        {MILESTONES.map(m => {
          const reached = progressPct >= m.pct
          return (
            <div key={m.pct} className={`${styles.milestone} ${reached ? styles.milestoneReached : ''}`}>
              <span className={styles.milestoneEmoji}>{m.emoji}</span>
              <span className={styles.milestonePct}>{m.label}</span>
              {reached && <span className={styles.milestoneTick}>✓</span>}
            </div>
          )
        })}
      </section>

      {/* Projection banner */}
      {price && currentValue > 0 && (
        <section className={styles.projBanner}>
          {currentValue >= goal
            ? <><span className={styles.projEmoji}>🎉</span><span>Goal reached — time to get Sean his Rolex!</span></>
            : <>
              <span className={styles.projEmoji}>🎯</span>
              <div>
                <div className={styles.projMain}>
                  Sean could afford this watch around <strong>{projStr}</strong>
                </div>
                <div className={styles.projDetail}>
                  Based on {contributions.length} contribution{contributions.length !== 1 ? 's' : ''} averaging <strong>{fmtInt(avgContribAmount)}</strong> {cadenceLabel} · QQQ growing at 15%/yr · {projMonths} months to go
                  <span className={styles.disclaimer}> · not financial advice</span>
                </div>
              </div>
            </>
          }
        </section>
)}

      {/* Projection + chart */}
      {price && currentValue > 0 && (
        <section className={styles.projSection}>
          <div className={styles.projHeader}>
            <div>
              <h3 className={styles.projTitle}>When can Sean afford it?</h3>
              <p className={styles.projSub}>Adjust your monthly contribution to see the date change live</p>
            </div>
            {currentValue >= goal && (
              <span className={styles.goalBadge}>🎉 Goal reached!</span>
            )}
          </div>

          {currentValue < goal && (
            <>
              <div className={styles.sliderRow}>
                <div className={styles.sliderLeft}>
                  <label className={styles.sliderLabel} htmlFor="contrib-slider">
                    Monthly contribution
                  </label>
                  <div className={styles.sliderAmount}>{fmtInt(effectiveMonthly)}<span className={styles.sliderAmountSub}>/mo</span></div>
                </div>
                <input
                  id="contrib-slider"
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={effectiveMonthly}
                  onChange={e => setMonthlyContrib(Number(e.target.value))}
                  className={styles.slider}
                  aria-label="Monthly contribution amount"
                />
                <div className={styles.sliderRight}>
                  <div className={styles.sliderDate}>{sliderProjStr}</div>
                  <div className={styles.sliderMonths}>{sliderMonths} months away</div>
                </div>
              </div>

              <div className={styles.projCalc}>
                <span>Based on <strong>{fmtInt(avgContribAmount)}</strong> avg actual contribution · {cadenceLabel} cadence · QQQ 15%/yr growth</span>
                <span className={styles.disclaimer}> · not financial advice</span>
              </div>
            </>
          )}

          <div className={styles.chartWrap}>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'#006039'}} />Projected value</span>
              <span className={styles.legendItem}><span className={styles.legendDash} />Total contributed</span>
              <span className={styles.legendGoal}>Goal: {fmtInt(goal)}</span>
            </div>
            <div style={{ position: 'relative', height: '260px' }}>
              <canvas ref={chartRef} aria-label="Projected fund value over time" role="img" />
            </div>
          </div>
        </section>
      )}

      {/* Contributions */}
      <section className={styles.contribSection}>
        <h3 className={styles.sectionTitle}>Contributions</h3>
        <p className={styles.hint}>Edit <code>data/contributions.json</code> and push to GitHub to log a new one.</p>
        {contributions.length === 0 ? (
          <p className={styles.empty}>No contributions yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th><th>Invested</th><th>Buy price</th>
                  <th>Shares</th><th>Current value</th><th>Gain</th><th>Note</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, i) => {
                  const shares = c.amount / c.buyPrice
                  const cv = price ? shares * price : 0
                  const cg = cv - c.amount
                  return (
                    <tr key={i} className={styles.tableRow}>
                      <td>{fmtDate(c.date)}</td>
                      <td>{fmt(c.amount)}</td>
                      <td>{fmt(c.buyPrice)}</td>
                      <td>{shares.toFixed(4)}</td>
                      <td className={styles.gold}>{price ? fmt(cv) : '—'}</td>
                      <td className={cg >= 0 ? styles.gainUp : styles.gainDown}>
                        {price ? `${cg >= 0 ? '+' : ''}${fmt(cg)}` : '—'}
                      </td>
                      <td className={styles.note}>{c.note ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        for Sean · {watchName} {watchRef} · one day at a time
      </footer>
    </main>
  )
}