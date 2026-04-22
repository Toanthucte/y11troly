import { useMemo } from 'react'
import { useAppStore } from '../../state/store'
import { SIDE_INPUT_KEYS } from '../../data/standards'
import type { MetricKey } from '../../data/standards'
import type { VisitData, MetricsSet } from '../../types'
import styles from './S30Export.module.css'

function isSideComplete(
  metrics: MetricsSet,
  keys: readonly MetricKey[],
): boolean {
  return keys.every((key) => metrics[key] !== null)
}

function toCsv(data: Record<string, string | number>): string {
  const keys = Object.keys(data)
  const escapeCsv = (value: string | number) => {
    const text = String(value)
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replaceAll('"', '""')}"`
    }
    return text
  }

  const header = keys.join(',')
  const row = keys.map((k) => escapeCsv(data[k])).join(',')
  return `${header}\n${row}\n`
}

function buildFlatExportRow(visit: VisitData): Record<string, string | number> {
  return {
    visit_id: visit.visitId,
    full_name: visit.patient.fullName,
    age: visit.patient.age,
    sex: visit.patient.sex,
    phone: visit.patient.phone,
    visit_time_text: visit.visitTimeText,
    visit_time_iso: visit.visitTimeIso,

    left_tt: visit.left.tt ?? '',
    left_ttr: visit.left.ttr ?? '',
    left_nt: visit.left.nt ?? '',
    left_dh: visit.left.dh ?? '',
    left_temp_forehead: visit.left.tempForehead ?? '',
    left_temp_little_finger: visit.left.tempLittleFingerLeft ?? '',
    left_temp_little_toe: visit.left.tempLittleToeLeft ?? '',
    left_ph: visit.left.ph ?? '',

    right_tt: visit.right.tt ?? '',
    right_ttr: visit.right.ttr ?? '',
    right_nt: visit.right.nt ?? '',

    foot_left_tt: visit.footLeft.tt ?? '',
    foot_left_ttr: visit.footLeft.ttr ?? '',
    foot_left_nt: visit.footLeft.nt ?? '',

    foot_right_tt: visit.footRight.tt ?? '',
    foot_right_ttr: visit.footRight.ttr ?? '',
    foot_right_nt: visit.footRight.nt ?? '',

    status_left_overall: visit.statusLeft.overall,
    status_right_overall: visit.statusRight.overall,
    status_foot_left_overall: visit.statusFootLeft.overall,
    status_foot_right_overall: visit.statusFootRight.overall,
  }
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function S30Export() {
  const {
    patient,
    visitTimeText,
    left,
    right,
    footLeft,
    footRight,
    buildVisitData,
    goToFirstIncomplete,
    setScreen,
  } = useAppStore()

  const visit = useMemo(
    () => buildVisitData(),
    [buildVisitData, patient, visitTimeText, left, right, footLeft, footRight],
  )

  const metricsReady =
    isSideComplete(left, SIDE_INPUT_KEYS.left) &&
    isSideComplete(right, SIDE_INPUT_KEYS.right) &&
    isSideComplete(footLeft, SIDE_INPUT_KEYS.footLeft) &&
    isSideComplete(footRight, SIDE_INPUT_KEYS.footRight)

  const canExport = Boolean(visit && metricsReady)

  function handleExportCsv() {
    if (!visit || !metricsReady) return
    const row = buildFlatExportRow(visit)
    const csv = toCsv(row)
    const stamp = visit.visitTimeIso
      ? new Date(visit.visitTimeIso)
          .toISOString()
          .replace(/[-:]/g, '')
          .slice(0, 13)
      : Date.now().toString()
    downloadTextFile(
      `Y11_${visit.patient.fullName.replaceAll(' ', '_')}_${stamp}.csv`,
      csv,
      'text/csv;charset=utf-8',
    )
  }

  function handleBackForCompletion() {
    goToFirstIncomplete()
    setScreen('khoiB')
  }

  function handleBackForReview() {
    setScreen('khoiB')
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Kết xuất</h2>
      <p className={styles.subtitle}>
        Xuất dữ liệu ca đo hiện tại sang định dạng file.
      </p>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Bệnh nhân</span>
          <span className={styles.value}>{patient?.fullName || 'Chưa có'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Thời gian đo</span>
          <span className={styles.value}>
            {visitTimeText || 'Chưa bấm Thời gian'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Bộ chỉ số</span>
          <span className={styles.value}>
            {metricsReady ? 'Đủ 4 bộ (17 trường)' : 'Chưa đủ dữ liệu'}
          </span>
        </div>
      </div>

      {!canExport && (
        <div className={styles.warnBox}>
          <div>Chưa thể kết xuất. Cần đủ điều kiện:</div>
          <ul className={styles.list}>
            <li>Đã có hồ sơ bệnh nhân từ Khối A</li>
            <li>Đã bấm nút Thời gian ở Khối B</li>
            <li>Đã nhập đủ 17 trường: Tt (8), Tp (3), Ct (3), Cp (3)</li>
          </ul>
          <button
            className={styles.secondaryBtn}
            onClick={handleBackForCompletion}
          >
            Quay lại Khối B để bổ sung dữ liệu
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          onClick={handleExportCsv}
          disabled={!canExport}
        >
          Xuất CSV ngay
        </button>
        {canExport && (
          <button className={styles.secondaryBtn} onClick={handleBackForReview}>
            Về Khối B (xem lại)
          </button>
        )}
      </div>

      <p className={styles.note}>
        PDF/PNG sẽ là bước tiếp theo trong pipeline export.
      </p>
    </section>
  )
}
