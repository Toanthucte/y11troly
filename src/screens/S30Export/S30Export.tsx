import { useMemo } from 'react'
import { useAppStore } from '../../state/store'
import type { MetricsSet, VisitData } from '../../types'
import styles from './S30Export.module.css'

function isMetricsComplete(metrics: MetricsSet): boolean {
  return Object.values(metrics).every((v) => v !== null)
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
    left_temp_hand: visit.left.tempHand ?? '',
    left_temp_foot: visit.left.tempFoot ?? '',
    left_ph: visit.left.ph ?? '',

    right_tt: visit.right.tt ?? '',
    right_ttr: visit.right.ttr ?? '',
    right_nt: visit.right.nt ?? '',
    right_dh: visit.right.dh ?? '',
    right_temp_forehead: visit.right.tempForehead ?? '',
    right_temp_hand: visit.right.tempHand ?? '',
    right_temp_foot: visit.right.tempFoot ?? '',
    right_ph: visit.right.ph ?? '',

    foot_left_tt: visit.footLeft.tt ?? '',
    foot_left_ttr: visit.footLeft.ttr ?? '',
    foot_left_nt: visit.footLeft.nt ?? '',
    foot_left_dh: visit.footLeft.dh ?? '',
    foot_left_temp_forehead: visit.footLeft.tempForehead ?? '',
    foot_left_temp_hand: visit.footLeft.tempHand ?? '',
    foot_left_temp_foot: visit.footLeft.tempFoot ?? '',
    foot_left_ph: visit.footLeft.ph ?? '',

    foot_right_tt: visit.footRight.tt ?? '',
    foot_right_ttr: visit.footRight.ttr ?? '',
    foot_right_nt: visit.footRight.nt ?? '',
    foot_right_dh: visit.footRight.dh ?? '',
    foot_right_temp_forehead: visit.footRight.tempForehead ?? '',
    foot_right_temp_hand: visit.footRight.tempHand ?? '',
    foot_right_temp_foot: visit.footRight.tempFoot ?? '',
    foot_right_ph: visit.footRight.ph ?? '',

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
    isMetricsComplete(left) &&
    isMetricsComplete(right) &&
    isMetricsComplete(footLeft) &&
    isMetricsComplete(footRight)

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
            {metricsReady ? 'Đủ 4 bộ (32 trường)' : 'Chưa đủ dữ liệu'}
          </span>
        </div>
      </div>

      {!canExport && (
        <div className={styles.warnBox}>
          <div>Chưa thể kết xuất. Cần đủ điều kiện:</div>
          <ul className={styles.list}>
            <li>Đã có hồ sơ bệnh nhân từ Khối A</li>
            <li>Đã bấm nút Thời gian ở Khối B</li>
            <li>Đã nhập đủ 4 bộ chỉ số: Tt, Tp, Ct, Cp</li>
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
