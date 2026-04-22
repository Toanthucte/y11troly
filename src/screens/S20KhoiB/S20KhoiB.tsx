import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../../state/store'
import type { InputSide } from '../../state/store'
import { getStandardByAge, SIDE_INPUT_KEYS } from '../../data/standards'
import {
  getLevelColor,
  getLevelLabel,
  evaluateMetrics,
} from '../../utils/alertRules'
import MetricsTable from '../../components/MetricsTable/MetricsTable'
import type { MetricKey } from '../../data/standards'
import type { MetricsSet } from '../../types'
import styles from './S20KhoiB.module.css'

const SIDE_ORDER: InputSide[] = ['left', 'right', 'footLeft', 'footRight']

const SIDE_ICON: Record<InputSide, string> = {
  left: '🖐 Tt',
  right: '✋ Tp',
  footLeft: '🦶 Ct',
  footRight: '🦶 Cp',
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
  tempForehead: 'Nhiệt Trán (NTr)',
  tempLittleFingerLeft: 'Nhiệt Ngón Tay Út (T) - NTÚ(T)',
  tempLittleToeLeft: 'Nhiệt Ngón Chân Út (T) - NCÚ(T)',
  ph: 'Nồng độ axit (pH)',
}

const FIELD_UNITS: Record<MetricKey, string> = {
  tt: 'mmHg',
  ttr: 'mmHg',
  nt: 'lần/ph',
  dh: 'mmol/L',
  tempForehead: '°C',
  tempLittleFingerLeft: '°C',
  tempLittleToeLeft: '°C',
  ph: '',
}

const LEFT_LABEL_OVERRIDES: Partial<Record<MetricKey, string>> = {
  tempLittleFingerLeft: 'NTÚ(T)',
  tempLittleToeLeft: 'NCÚ(T)',
}

function isSideComplete(metrics: MetricsSet, keys: readonly MetricKey[]) {
  return keys.every((key) => metrics[key] !== null)
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
  const currentSideKeys = SIDE_INPUT_KEYS[inputSide]
  const safeFieldIndex = Math.min(inputFieldIndex, currentSideKeys.length - 1)
  const currentKey = currentSideKeys[safeFieldIndex]
  const isLastField = safeFieldIndex === currentSideKeys.length - 1

  const statusLeft = evaluateMetrics(left, std, SIDE_INPUT_KEYS.left)
  const statusRight = evaluateMetrics(right, std, SIDE_INPUT_KEYS.right)
  const statusFootLeft = evaluateMetrics(
    footLeft,
    std,
    SIDE_INPUT_KEYS.footLeft,
  )
  const statusFootRight = evaluateMetrics(
    footRight,
    std,
    SIDE_INPUT_KEYS.footRight,
  )

  const allDone = useMemo(() => {
    return (
      isSideComplete(left, SIDE_INPUT_KEYS.left) &&
      isSideComplete(right, SIDE_INPUT_KEYS.right) &&
      isSideComplete(footLeft, SIDE_INPUT_KEYS.footLeft) &&
      isSideComplete(footRight, SIDE_INPUT_KEYS.footRight)
    )
  }, [left, right, footLeft, footRight])

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
    const currentMetrics =
      inputSide === 'left'
        ? left
        : inputSide === 'right'
          ? right
          : inputSide === 'footLeft'
            ? footLeft
            : footRight

    if (!isNaN(num)) {
      setMetricValue(inputSide, currentKey, num)
    } else if (currentMetrics[currentKey] === null) {
      return
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

      <div className={styles.patientBar}>
        <span className={styles.patientName}>{patient.fullName}</span>
        <span className={styles.patientAge}>
          {patient.age} tuổi · {std.ageGroup}
        </span>
      </div>

      <MetricsTable std={std} label="Tiêu chuẩn theo lứa tuổi" columns={4} />

      <div className={styles.timeRow}>
        <button className={styles.timeBtn} onClick={handleSetTime}>
          ⏱ Thời gian
        </button>
        {visitTimeText && (
          <span className={styles.timeText}>{visitTimeText}</span>
        )}
      </div>

      <MetricsTable
        std={std}
        values={left}
        status={statusLeft}
        label="Tay Trái (Tt)"
        columns={4}
        labelOverrides={LEFT_LABEL_OVERRIDES}
        highlight
      />

      <MetricsTable
        std={std}
        values={right}
        status={statusRight}
        keys={SIDE_INPUT_KEYS.right}
        columns={3}
        label="Tay Phải (Tp)"
        highlight
      />

      <MetricsTable
        std={std}
        values={footLeft}
        status={statusFootLeft}
        keys={SIDE_INPUT_KEYS.footLeft}
        columns={3}
        label="Chân Trái (Ct)"
        highlight
      />

      <MetricsTable
        std={std}
        values={footRight}
        status={statusFootRight}
        keys={SIDE_INPUT_KEYS.footRight}
        columns={3}
        label="Chân Phải (Cp)"
        highlight
      />

      {!allDone && (
        <div className={styles.inputBlock}>
          <div className={styles.inputHeader}>
            <span className={styles.inputSideLabel}>
              {SIDE_ICON[inputSide]} · Trường {safeFieldIndex + 1}/
              {currentSideKeys.length}
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
          <span>
            ✓ Đã nhập đủ 17 trường (Tt 8 + Tp 3 + Ct 3 + Cp 3). Sẵn sàng kết
            xuất.
          </span>
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
