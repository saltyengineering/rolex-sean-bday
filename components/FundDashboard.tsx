'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './FundDashboard.module.css'

interface Contribution {
  date: string
  amount: number
  buyPrice: number
  note?: string
}

interface QQQData {
  price: number | null
  changePct: number | null
  error?: boolean
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

export default function FundDashboard({ contributions, goal, onBack, watchName = 'Submariner', watchRef = 'Ref. 124060' }: Props) {
  const [qqq, setQqq] = useState<QQQData>({ price: null, changePct: null })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

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

  const price = qqq.price ?? 0
  const totalInvested = contributions.reduce((s, c) => s + c.amount, 0)
  const totalShares = contributions.reduce((s, c) => s + c.amount / c.buyPrice, 0)
  const currentValue = price ? totalShares * price : 0
  const gain = currentValue - totalInvested
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0
  const progressPct = Math.min((currentValue / goal) * 100, 100)
  const changePct = qqq.changePct ?? 0

  const avgMonthly = totalInvested / Math.max(contributions.length, 1)
  const monthlyRate = Math.pow(1.153, 1 / 12) - 1
  let projVal = currentValue
  let projMonths = 0
  if (price && currentValue < goal) {
    while (projVal < goal && projMonths < 600) {
      projVal = projVal * (1 + monthlyRate) + avgMonthly
      projMonths++
    }
  }
  const projDate = new Date()
  projDate.setMonth(projDate.getMonth() + projMonths)
  const projStr = projDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <main className={styles.main}>
      <h1 className="sr-only">Rolex Submariner Fund — Sean&apos;s Watch</h1>

      {onBack && (
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to intro">
          ← back
        </button>
      )}

      <header className={styles.header}>
        <svg className={styles.crown} width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="20" stroke="#006039" strokeWidth="1.5" fill="none" />
          <circle cx="22" cy="22" r="15" stroke="#C9A84C" strokeWidth="0.5" strokeDasharray="2 3" fill="none" />
          <text x="22" y="27" textAnchor="middle" fontSize="14" fill="#C9A84C" fontFamily="serif">♛</text>
        </svg>
        <h2 className={styles.title}>Sean&apos;s Rolex Fund</h2>
        <p className={styles.subtitle}>QQQ · {watchName} · {watchRef} · Goal: {fmtInt(goal)}</p>
      </header>

      <div className={styles.card}>
        <div className={styles.qqqBar}>
          <div className={styles.qqqLeft}>
            <span className={styles.ticker}>QQQ</span>
            <span className={styles.qqqPrice}>
              {loading ? '—' : qqq.price ? fmt(qqq.price) : 'unavailable'}
            </span>
            {!loading && qqq.price && (
              <span className={`${styles.change} ${changePct >= 0 ? styles.up : styles.down}`}
                    style={{ background: changePct >= 0 ? 'var(--up-bg)' : 'var(--down-bg)' }}>
                {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}% today
              </span>
            )}
          </div>
          <div className={styles.qqqRight}>
            {lastUpdated && <span className={styles.updated}>as of {lastUpdated}</span>}
            <button className={styles.refreshBtn} onClick={fetchQQQ} aria-label="Refresh QQQ price">
              ↻ refresh
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {[
            { label: 'Total invested', val: fmtInt(totalInvested), cls: '' },
            { label: 'Current value',  val: price ? fmtInt(currentValue) : '—', cls: styles.gold },
            { label: 'Total gain',     val: price ? `${gain >= 0 ? '+' : ''}${fmt(gain)}` : '—', cls: gain >= 0 ? styles.up : styles.down },
            { label: 'Return',         val: price ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : '—', cls: gainPct >= 0 ? styles.up : styles.down },
            { label: 'Shares held',    val: totalShares.toFixed(4), cls: '' },
            { label: 'Remaining',      val: price ? fmtInt(Math.max(goal - currentValue, 0)) : '—', cls: '' },
          ].map(({ label, val, cls }) => (
            <div key={label} className={styles.stat}>
              <div className={styles.statLabel}>{label}</div>
              <div className={`${styles.statValue} ${cls}`}>{val}</div>
            </div>
          ))}
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressLabels}>
            <span>{progressPct.toFixed(1)}% of goal</span>
            <span>{fmtInt(goal)}</span>
          </div>
          <div className={styles.trackBg}>
            <div className={styles.trackFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {price && currentValue > 0 && (
          <div className={styles.projection}>
            {currentValue >= goal
              ? '🎉 Goal reached — time to get Sean his Rolex!'
              : <><span>At QQQ&apos;s 20-yr avg (~15%/yr) and your current pace, you could hit </span><strong>{fmtInt(goal)}</strong><span> around </span><strong>{projStr}</strong><span> — {projMonths} months away. Keep going! </span><span className={styles.disclaimer}>(Not financial advice.)</span></>
            }
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Contributions</h3>
        <p className={styles.hint}>
          To log a new contribution, edit <code>data/contributions.json</code> and push to GitHub.
        </p>
        {contributions.length === 0 ? (
          <p className={styles.empty}>No contributions yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invested</th>
                  <th>Buy price</th>
                  <th>Shares</th>
                  <th>Current value</th>
                  <th>Gain</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, i) => {
                  const shares = c.amount / c.buyPrice
                  const cv = price ? shares * price : 0
                  const cg = cv - c.amount
                  return (
                    <tr key={i}>
                      <td>{fmtDate(c.date)}</td>
                      <td>{fmt(c.amount)}</td>
                      <td>{fmt(c.buyPrice)}</td>
                      <td>{shares.toFixed(4)}</td>
                      <td className={styles.gold}>{price ? fmt(cv) : '—'}</td>
                      <td className={cg >= 0 ? styles.up : styles.down}>
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
      </div>

      <footer className={styles.footer}>
        for Sean · {watchName} {watchRef} · one day at a time
      </footer>
    </main>
  )
}