import { useState } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../../state/store'
import type { InputSide } from '../../state/store'
import { getStandardByAge } from '../../data/standards'
import {
  METRICS_KEYS,
  getLevelColor,
  getLevelLabel,
  evaluateMetrics,
} from '../../utils/alertRules'
import MetricsTable from '../../components/MetricsTable/MetricsTable'
import type { MetricKey } from '../../data/standards'
import styles from './S20KhoiB.module.css'

const SIDE_ORDER: InputSide[] = ['left', 'right', 'footLeft', 'footRight']

const SIDE_ICON: Record<InputSide, string> = {
  left: '🖐 Tay Trái',
  right: '✋ Tay Phải',
  footLeft: '🦶 Chân Trái',
  footRight: '🦶 Chân Phải',
}

const NEXT_SIDE_LABEL: Record<InputSide, string> = {
  left: 'Sang Tay phải →',
  right: 'Sang Chân trái →',
  footLeft: 'Sang Chân phải →',
  footRight: 'Hoàn tất ✓',
}

const FIELD_LABELS: Record<MetricKey, string> = {
  tt: 'Tâm thu (TT)',
  ttr: 'Tâm trương (TTr)',
  nt: 'Nhịp tim (NT)',
  dh: 'Đường huyết (ĐH)',
  tempForehead: 'Nhiệt Trán',
  tempHand: 'Nhiệt Tay',
  tempFoot: 'Nhiệt Chân',
  ph: 'pH',
}

const FIELD_UNITS: Record<MetricKey, string> = {
  tt: 'mmHg',
  ttr: 'mmHg',
  nt: 'lần/ph',
  dh: 'mmol/L',
  tempForehead: '°C',
  tempHand: '°C',
  tempFoot: '°C',
  ph: '',
}

export default function S20KhoiB() {
  const {
    patient,
    visitTimeText,
    left,
    right,
    footLeft,
    footRight,
    inputSide,
    inputFieldIndex,
    setVisitTime,
    setMetricValue,
    setScreen,
    nextField,
    prevField,
  } = useAppStore()

  const [inputVal, setInputVal] = useState('')

  if (!patient) return null

  const std = getStandardByAge(patient.age)
  const currentKey = METRICS_KEYS[inputFieldIndex]
  const isLastField = inputFieldIndex === 7
  const isLastSide = inputSide === 'footRight'
  const allDone = isLastField && isLastSide

  const statusLeft = evaluateMetrics(left, std)
  const statusRight = evaluateMetrics(right, std)
  const statusFootLeft = evaluateMetrics(footLeft, std)
  const statusFootRight = evaluateMetrics(footRight, std)

  const allStatuses = [statusLeft, statusRight, statusFootLeft, statusFootRight]
  const hasAlert = allStatuses.some((s) => s.overall === 'alert')
  const hasWatch = allStatuses.some((s) => s.overall === 'watch')
  const overallLevel = hasAlert ? 'alert' : hasWatch ? 'watch' : 'normal'

  function handleSetTime() {
    const now = dayjs()
    const text = now.format('HH:mm - DD/MM/YY')
    const iso = now.toISOString()
    setVisitTime(text, iso)
  }

  function handleNext() {
    const num = parseFloat(inputVal.replace(',', '.'))
    if (!isNaN(num)) {
      setMetricValue(inputSide, currentKey, num)
    }
    setInputVal('')
    nextField()
  }

  function handlePrev() {
    setInputVal('')
    prevField()
  }

  return (
    <div className={styles.container}>
      {/* Cảnh báo tổng */}
      {(hasAlert || hasWatch) && (
        <div
          className={styles.alertBanner}
          style={{
            background: getLevelColor(overallLevel) + '22',
            borderColor: getLevelColor(overallLevel),
          }}
        >
          <span style={{ color: getLevelColor(overallLevel) }}>
            ⚠ {getLevelLabel(overallLevel)}: có chỉ số nằm ngoài tiêu chuẩn
          </span>
        </div>
      )}

      {/* Thanh thông tin cố định */}
      <div className={styles.patientBar}>
        <span className={styles.patientName}>{patient.fullName}</span>
        <span className={styles.patientAge}>
          {patient.age} tuổi · {std.ageGroup}
        </span>
      </div>

      {/* Bảng tiêu chuẩn */}
      <MetricsTable std={std} label="Tiêu chuẩn theo lứa tuổi" />

      {/* Dòng thời gian */}
      <div className={styles.timeRow}>
        <button className={styles.timeBtn} onClick={handleSetTime}>
          ⏱ Thời gian
        </button>
        {visitTimeText && (
          <span className={styles.timeText}>{visitTimeText}</span>
        )}
      </div>

      {/* Bảng Tay Trái */}
      <MetricsTable
        std={std}
        values={left}
        status={statusLeft}
        label="Tay Trái (Tt)"
        highlight
      />

      {/* Bảng Tay Phải */}
      <MetricsTable
        std={std}
        values={right}
        status={statusRight}
        label="Tay Phải (Tp)"
        highlight
      />

      {/* Bảng Chân Trái */}
      <MetricsTable
        std={std}
        values={footLeft}
        status={statusFootLeft}
        label="Chân Trái (Ct)"
        highlight
      />

      {/* Bảng Chân Phải */}
      <MetricsTable
        std={std}
        values={footRight}
        status={statusFootRight}
        label="Chân Phải (Cp)"
        highlight
      />

      {/* Khối nhập liệu */}
      {!allDone && (
        <div className={styles.inputBlock}>
          <div className={styles.inputHeader}>
            <span className={styles.inputSideLabel}>
              {SIDE_ICON[inputSide]} · Trường {inputFieldIndex + 1}/8
            </span>
            <span className={styles.stepIndicator}>
              Bộ {SIDE_ORDER.indexOf(inputSide) + 1}/4
            </span>
          </div>

          <div className={styles.fieldLabel}>{FIELD_LABELS[currentKey]}</div>
          <div className={styles.fieldUnit}>{FIELD_UNITS[currentKey]}</div>

          <input
            className={styles.metricInput}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            inputMode="decimal"
            placeholder={`Nhập ${FIELD_LABELS[currentKey]}`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNext()
            }}
          />

          <div className={styles.navBtns}>
            <button className={styles.backBtn} onClick={handlePrev}>
              ← Quay lại
            </button>
            <button className={styles.nextBtn} onClick={handleNext}>
              {isLastField ? NEXT_SIDE_LABEL[inputSide] : 'Tiếp tục →'}
            </button>
          </div>
        </div>
      )}

      {allDone && (
        <div className={styles.doneBlock}>
          <span>✓ Đã nhập đủ cả 4 bộ. Sẵn sàng kết xuất.</span>
          <div className={styles.doneActions}>
            <button
              className={styles.doneBtn}
              onClick={() => setScreen('export')}
            >
              Mở màn hình Kết xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
