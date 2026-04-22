import { useEffect, useRef } from 'react'
import { useAppStore } from '../../state/store'
import styles from './S00Intro.module.css'

export default function S00Intro() {
  const setScreen = useAppStore((s) => s.setScreen)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setScreen('khoiA')
    }, 11000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [setScreen])

  function skip() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setScreen('khoiA')
  }

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      <div className={styles.logoWrap}>
        <svg
          className={styles.logo}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {/* Chữ Y */}
          <text
            x="50%"
            y="52%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="url(#logoGrad)"
            fontSize="96"
            fontWeight="900"
            fontFamily="'Segoe UI', system-ui, sans-serif"
            letterSpacing="-4"
          >
            Y11
          </text>
        </svg>
      </div>
      <p className={styles.tagline}>Khí Công Y Đạo · Trợ lý chẩn đoán</p>
      <button className={styles.skip} onClick={skip}>
        Bỏ qua
      </button>
    </div>
  )
}
