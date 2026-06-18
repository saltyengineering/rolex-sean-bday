'use client'

import { useState } from 'react'
import IntroScreen from './IntroScreen'
import styles from './GiftScreen.module.css'

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

export default function GiftScreen({ contributions, goal }: Props) {
  const [opened, setOpened] = useState(false)

  if (opened) return <IntroScreen contributions={contributions} goal={goal} />

  return (
    <main className={styles.scene}>
      <h1 className="sr-only">A gift for Sean</h1>

      <div className={styles.content}>
        <div className={styles.giftBox} aria-hidden="true">
          <div className={styles.boxLid}>
            <div className={styles.ribbon} />
          </div>
          <div className={styles.boxBody}>
            <div className={styles.ribbonV} />
          </div>
          <div className={styles.bow}>
            <div className={styles.bowLeft} />
            <div className={styles.bowRight} />
            <div className={styles.bowKnot} />
          </div>
        </div>

        <p className={styles.to}>To: Sean</p>
        <p className={styles.from}>From: someone who loves you</p>

        <button
          className={styles.openBtn}
          onClick={() => setOpened(true)}
          aria-label="Open your gift"
        >
          Open gift
        </button>
      </div>
    </main>
  )
}