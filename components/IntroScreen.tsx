'use client'

import { useState, useEffect, useRef } from 'react'
import FundDashboard from './FundDashboard'
import styles from './IntroScreen.module.css'

interface Contribution {
  date: string
  amount: number
  buyPrice: number
  note?: string
}

interface Props {
  contributions: Contribution[]
  goal: number
}

const WATCHES = [
  {
    id: 'submariner',
    name: 'Submariner',
    ref: 'Ref. 124060',
    price: 52000,
    desc: 'Oyster, 41 mm, yellow gold',
    video: 'https://media.rolex.com/video/upload/c_limit,q_auto:best,w_2160/vc_vp9/v1/rolexcom/collection/family-pages/professional-watches/submariner/family-page/2026/videos/player-expland/long-film/professsional-watches-submariner-film-portrait.webm',
  },
  {
    id: 'daytona',
    name: 'Cosmograph Daytona',
    ref: 'Ref. 116500LN',
    price: 24500,
    desc: 'Oyster, 40 mm, yellow gold',
    video: 'https://media.rolex.com/video/upload/c_limit,q_auto:best,w_2160/vc_vp9/v1/rolexcom/collection/family-pages/professional-watches/cosmograph-daytona/landing/2025/videos/professional-watches-cosmograph-daytona-autoplay-video-m126508-0008-portrait.webm',
  },
  {
    id: 'gmt',
    name: 'GMT-Master II',
    ref: 'Ref. 126710BLRO',
    price: 15500,
    desc: '"Pepsi" · Two-tone bezel · 40mm',
    video: 'https://media.rolex.com/video/upload/c_limit,q_auto:good,w_2160/vc_vp9/v1/rolexcom/collection/family-pages/professional-watches/gmt-master-ii/family-page/videos/cover/2024/long-film/video-cover_2022-retailer-film-gmt-master-ii-film-30-version-c-16x9-texted-clock-py-ly.webm',
  },
  {
    id: 'explorer',
    name: 'Yacht-Master II',
    ref: 'Ref. 226570',
    price: 20300,
    desc: 'White dial · GMT hand · 42mm',
    video: 'https://media.rolex.com/video/upload/c_limit,q_auto:best,w_2160/vc_vp9/v1/rolexcom/094398bf1f99/collection/professional-watches/yacht-master-ii/landing-page/videos/long-film/professsional-watches-yacht-master-ii-m126680-0001-film.webm',
  },
]

const CONFETTI_COLORS = [
  '#006039','#006039','#006039',
  '#C9A84C','#C9A84C','#C9A84C',
  '#008f55','#e8c55a',
  '#004d2c','#a07830',
]

interface Piece {
  x: number; y: number; size: number; color: string
  rotation: number; rotSpeed: number; vx: number; vy: number
  shape: 'rect' | 'circle'; opacity: number; delay: number; born: number
}

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const TOTAL = 140

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect()
      canvas!.width = rect.width
      canvas!.height = rect.height
    }

    const pieces: Piece[] = Array.from({ length: TOTAL }, (_, i) => ({
      x: 0.05 + Math.random() * 0.9,
      y: -0.05 - Math.random() * 0.3,
      size: 5 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      vx: (Math.random() - 0.5) * 0.004,
      vy: 0.004 + Math.random() * 0.007,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      opacity: 0,
      delay: i * 16,
      born: 0,
    }))

    let frame = 0
    let animId: number
    let alive = true

    function draw() {
      resize()
      const w = canvas!.width, h = canvas!.height
      ctx.clearRect(0, 0, w, h)
      alive = false

      for (const p of pieces) {
        if (frame < p.delay) { alive = true; continue }
        if (p.born === 0) p.born = frame
        const age = frame - p.born
        p.opacity = Math.min(1, age / 20)
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed
        const px = p.x * w, py = p.y * h
        if (py < h + 30) alive = true
        const fade = Math.max(0, 1 - Math.max(0, (py - h * 0.7) / (h * 0.3)))
        ctx.save()
        ctx.globalAlpha = p.opacity * fade
        ctx.translate(px, py)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      frame++
      if (alive || frame < 400) animId = requestAnimationFrame(draw)
    }

    resize()
    const t = setTimeout(draw, 300)
    return () => { clearTimeout(t); cancelAnimationFrame(animId) }
  }, [canvasRef])
}

export default function IntroScreen({ contributions, goal }: Props) {
  const [entered, setEntered] = useState(false)
  const [selectedWatch, setSelectedWatch] = useState(WATCHES[0])
  const [videoError, setVideoError] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useConfetti(canvasRef)

  const totalInvested = contributions.reduce((s, c) => s + c.amount, 0)
  const totalShares = contributions.reduce((s, c) => s + c.amount / c.buyPrice, 0)

  if (entered) {
    return (
      <FundDashboard
        contributions={contributions}
        goal={selectedWatch.price}
        onBack={() => setEntered(false)}
        watchName={selectedWatch.name}
        watchRef={selectedWatch.ref}
      />
    )
  }

  return (
    <main className={styles.scene}>
      <h1 className="sr-only">Rolex fund birthday intro for Sean</h1>

      <canvas ref={canvasRef} className={styles.confettiCanvas} aria-hidden="true" />

      <div className={styles.topBar} />
      <div className={styles.botBar} />

      <div className={styles.layout}>

        {/* Left: video */}
        <div className={styles.videoCol}>
          <div className={styles.videoWrap}>
            {!videoError ? (
              <video
                key={selectedWatch.id}
                className={styles.video}
                autoPlay loop playsInline
                onError={() => setVideoError(true)}
              >
                <source src={selectedWatch.video} type="video/webm" />
              </video>
            ) : (
              <div className={styles.videoFallback}>
                <div className={styles.crownRing}>
                  <div className={styles.crownInner}>♛</div>
                </div>
                <p className={styles.videoFallbackText}>{selectedWatch.name}</p>
              </div>
            )}
            <div className={styles.videoOverlay} />
          </div>
        </div>

        {/* Right: content */}
        <div className={styles.contentCol}>

          <div className={styles.birthdayBlock}>
            <div className={styles.crownRing}>
              <div className={styles.crownInner}>♛</div>
            </div>
            <p className={styles.eyebrow}>Rolex · Since 1905</p>
            <p className={styles.happyBirthday}>Happy Birthday,<br /><span className={styles.nameGreen}>Sean!</span></p>
            <p className={styles.promise}>
              The Rolex isn&apos;t here yet —<br />
              <strong>but this promise is.</strong>
            </p>
          </div>

          <div className={styles.goldenDivider} />

          {/* Watch selector */}
          <div className={styles.selectorBlock}>
            <p className={styles.selectorLabel}>Choose your watch!</p>
            <div className={styles.watchGrid}>
              {WATCHES.map(w => (
                <button
                  key={w.id}
                  className={`${styles.watchCard} ${selectedWatch.id === w.id ? styles.watchCardActive : ''}`}
                  onClick={() => { setSelectedWatch(w); setVideoError(false) }}
                  aria-pressed={selectedWatch.id === w.id}
                >
                  <span className={styles.watchCardName}>{w.name}</span>
                  <span className={styles.watchCardRef}>{w.ref}</span>
                  <span className={styles.watchCardPrice}>~${w.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
            <p className={styles.watchDesc}>{selectedWatch.desc}</p>
          </div>

          {/* Stats strip */}
          <div className={styles.statsStrip}>
            <div className={styles.stripItem}>
              <div className={styles.stripLabel}>saved so far</div>
              <div className={styles.stripVal}>${Math.round(totalInvested).toLocaleString()}</div>
            </div>
            <div className={styles.stripDiv} />
            <div className={styles.stripItem}>
              <div className={styles.stripLabel}>QQQ shares</div>
              <div className={styles.stripVal}>{totalShares.toFixed(4)}</div>
            </div>
            <div className={styles.stripDiv} />
            <div className={styles.stripItem}>
              <div className={styles.stripLabel}>goal</div>
              <div className={styles.stripVal}>${selectedWatch.price.toLocaleString()}</div>
            </div>
          </div>

          <button className={styles.enterBtn} onClick={() => setEntered(true)}>
            View the fund →
          </button>

          <p className={styles.footnote}>via QQQ · Nasdaq-100 · one day at a time</p>
        </div>
      </div>
    </main>
  )
}