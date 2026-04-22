import { useState } from 'react'
import { useAppStore } from '../../state/store'
import type { PatientProfile, Sex } from '../../types'
import styles from './S10KhoiA.module.css'

const CURRENT_YEAR = new Date().getFullYear()

function calcAge(input: string): number | null {
  const n = Number(input.trim())
  if (!Number.isInteger(n)) return null
  if (n >= 1900 && n <= CURRENT_YEAR) return CURRENT_YEAR - n // năm sinh
  if (n >= 0 && n <= 120) return n // tuổi trực tiếp
  return null
}

export default function S10KhoiA() {
  const { setPatient, setScreen } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [ageInput, setAgeInput] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const computedAge = calcAge(ageInput)
  const phoneOk = /^0\d{9,10}$/.test(phone.trim())
  const canContinue =
    fullName.trim().length >= 2 && computedAge !== null && phoneOk

  function handleContinue() {
    if (!canContinue) {
      setError('Vui lòng kiểm tra lại thông tin.')
      return
    }
    const profile: PatientProfile = {
      fullName: fullName.trim(),
      age: computedAge!,
      sex,
      phone: phone.trim(),
    }
    setPatient(profile)
    setScreen('khoiB')
  }

  if (!showForm) {
    return (
      <div className={styles.heroContainer}>
        <button className={styles.heroBtn} onClick={() => setShowForm(true)}>
          <span className={styles.plus}>＋</span>
          <span className={styles.heroLabel}>Tạo nhanh</span>
        </button>
        <p className={styles.hint}>Nhấn để bắt đầu hồ sơ ca mới</p>
      </div>
    )
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Hồ sơ ca mới</h2>

      <div className={styles.field}>
        <label className={styles.label}>Họ tên *</label>
        <input
          className={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nhập họ tên đầy đủ"
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Tuổi hoặc Năm sinh *</label>
        <input
          className={styles.input}
          value={ageInput}
          onChange={(e) => {
            setAgeInput(e.target.value)
            setError('')
          }}
          placeholder="vd: 42 hoặc 1982"
          inputMode="numeric"
        />
        {ageInput && (
          <p className={computedAge !== null ? styles.hint : styles.error}>
            {computedAge !== null
              ? `→ Tuổi: ${computedAge}`
              : 'Giá trị không hợp lệ'}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Giới tính *</label>
        <div className={styles.sexGroup}>
          {(['male', 'female', 'other'] as Sex[]).map((s) => (
            <button
              key={s}
              className={`${styles.sexBtn} ${sex === s ? styles.sexActive : ''}`}
              onClick={() => setSex(s)}
              type="button"
            >
              {s === 'male' ? 'Nam' : s === 'female' ? 'Nữ' : 'Khác'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Số điện thoại *</label>
        <input
          className={styles.input}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setError('')
          }}
          placeholder="0xxxxxxxxx"
          inputMode="tel"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={`${styles.continueBtn} ${canContinue ? styles.continueBtnActive : ''}`}
        onClick={handleContinue}
        disabled={!canContinue}
      >
        Tiếp tục →
      </button>
    </div>
  )
}
