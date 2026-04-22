import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { SIDE_INPUT_KEYS } from '../../data/standards'
import type { MetricKey } from '../../data/standards'
import type { VisitData, MetricsSet } from '../../types'
import MetricsTable from '../../components/MetricsTable/MetricsTable'
import { getStandardByAge } from '../../data/standards'
import {
  loadSheetsConfig,
  appendVisitToSheet,
} from '../../services/sheets/sheetsService'
import {
  exportElementToPdf,
  exportElementToPng,
  makeExportStamp,
} from '../../services/export/fileExport'
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

const LEFT_LABEL_OVERRIDES: Partial<Record<MetricKey, string>> = {
  tempLittleFingerLeft: 'NTÚ(T)',
  tempLittleToeLeft: 'NCÚ(T)',
}

export default function S30Export() {
  const {
    patient,
    visitTimeText,
    left,
    right,
    footLeft,
    footRight,
    sheetsToken,
    buildVisitData,
    addVisitToHistory,
    goToFirstIncomplete,
    setScreen,
  } = useAppStore()

  const [sheetsWriteStatus, setSheetsWriteStatus] = useState<
    'idle' | 'writing' | 'ok' | 'err'
  >('idle')
  const [fileExportStatus, setFileExportStatus] = useState<
    'idle' | 'working' | 'ok' | 'err'
  >('idle')
  const reportRef = useRef<HTMLDivElement>(null)

  const visit = useMemo(
    () => buildVisitData(),
    [buildVisitData, patient, visitTimeText, left, right, footLeft, footRight],
  )
  const std = useMemo(() => {
    if (!visit) return null
    return getStandardByAge(visit.patient.age)
  }, [visit])

  const metricsReady =
    isSideComplete(left, SIDE_INPUT_KEYS.left) &&
    isSideComplete(right, SIDE_INPUT_KEYS.right) &&
    isSideComplete(footLeft, SIDE_INPUT_KEYS.footLeft) &&
    isSideComplete(footRight, SIDE_INPUT_KEYS.footRight)

  const canExport = Boolean(visit && metricsReady)

  async function handleExportCsv() {
    if (!visit || !metricsReady) return
    addVisitToHistory(visit)
    const row = buildFlatExportRow(visit)
    const csv = toCsv(row)
    const stamp = makeExportStamp(visit.visitTimeIso)
    downloadTextFile(
      `Y11_${visit.patient.fullName.replaceAll(' ', '_')}_${stamp}.csv`,
      csv,
      'text/csv;charset=utf-8',
    )

    // Auto-ghi lên Google Sheets nếu đã kết nối
    const cfg = loadSheetsConfig()
    if (sheetsToken && cfg?.spreadsheetId) {
      setSheetsWriteStatus('writing')
      try {
        await appendVisitToSheet(sheetsToken, cfg.spreadsheetId, row)
        setSheetsWriteStatus('ok')
      } catch {
        setSheetsWriteStatus('err')
      }
    }
  }

  async function handleExportPng() {
    if (!visit || !reportRef.current) return
    setFileExportStatus('working')
    try {
      const stamp = makeExportStamp(visit.visitTimeIso)
      await exportElementToPng(
        reportRef.current,
        `Y11_${visit.patient.fullName.replaceAll(' ', '_')}_${stamp}.png`,
        300,
      )
      setFileExportStatus('ok')
    } catch {
      setFileExportStatus('err')
    }
  }

  async function handleExportPdf() {
    if (!visit || !reportRef.current) return
    setFileExportStatus('working')
    try {
      const stamp = makeExportStamp(visit.visitTimeIso)
      await exportElementToPdf(
        reportRef.current,
        `Y11_${visit.patient.fullName.replaceAll(' ', '_')}_${stamp}.pdf`,
      )
      setFileExportStatus('ok')
    } catch {
      setFileExportStatus('err')
    }
  }

  function handlePrintA4() {
    if (!canExport) return
    document.body.classList.add('print-export-report')
    window.print()
    setTimeout(() => {
      document.body.classList.remove('print-export-report')
    }, 300)
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
        {sheetsWriteStatus === 'writing' && (
          <p className={styles.note}>Đang ghi lên Google Sheets…</p>
        )}
        {sheetsWriteStatus === 'ok' && (
          <p className={styles.note} style={{ color: '#86efac' }}>
            ✓ Đã ghi lên Google Sheets
          </p>
        )}
        {sheetsWriteStatus === 'err' && (
          <p className={styles.note} style={{ color: '#fca5a5' }}>
            ⚠ Không ghi được lên Sheets (CSV đã lưu thành công)
          </p>
        )}
        <button
          className={styles.secondaryBtn}
          onClick={handleExportPdf}
          disabled={!canExport}
        >
          Xuất PDF
        </button>
        <button
          className={styles.secondaryBtn}
          onClick={handleExportPng}
          disabled={!canExport}
        >
          Xuất PNG (300 DPI)
        </button>
        <button
          className={styles.secondaryBtn}
          onClick={handlePrintA4}
          disabled={!canExport}
        >
          In A4
        </button>
        {canExport && (
          <button className={styles.secondaryBtn} onClick={handleBackForReview}>
            Về Khối B (xem lại)
          </button>
        )}
      </div>

      {fileExportStatus === 'working' && (
        <p className={styles.note}>Đang tạo file PDF/PNG…</p>
      )}
      {fileExportStatus === 'ok' && (
        <p className={styles.note} style={{ color: '#86efac' }}>
          ✓ Đã xuất file thành công
        </p>
      )}
      {fileExportStatus === 'err' && (
        <p className={styles.note} style={{ color: '#fca5a5' }}>
          ⚠ Xuất PDF/PNG thất bại
        </p>
      )}

      {visit && std && (
        <div ref={reportRef} className={styles.reportSheet}>
          <div className={styles.reportHeader}>BÁO CÁO Y11</div>
          <div className={styles.reportMeta}>
            <div>Bệnh nhân: {visit.patient.fullName}</div>
            <div>Tuổi: {visit.patient.age}</div>
            <div>Giới tính: {visit.patient.sex}</div>
            <div>Điện thoại: {visit.patient.phone}</div>
            <div>Thời gian: {visit.visitTimeText}</div>
          </div>

          <div className={styles.reportBlock}>
            <MetricsTable std={std} label="Tiêu chuẩn" columns={4} />
          </div>

          <div className={styles.reportBlock}>
            <MetricsTable
              std={std}
              values={visit.left}
              status={visit.statusLeft}
              label="Tay Trái (Tt)"
              columns={4}
              labelOverrides={LEFT_LABEL_OVERRIDES}
              highlight
            />
          </div>

          <div className={styles.reportBlock}>
            <MetricsTable
              std={std}
              values={visit.right}
              status={visit.statusRight}
              keys={SIDE_INPUT_KEYS.right}
              columns={3}
              label="Tay Phải (Tp)"
              highlight
            />
          </div>

          <div className={styles.reportBlock}>
            <MetricsTable
              std={std}
              values={visit.footLeft}
              status={visit.statusFootLeft}
              keys={SIDE_INPUT_KEYS.footLeft}
              columns={3}
              label="Chân Trái (Ct)"
              highlight
            />
          </div>

          <div className={styles.reportBlock}>
            <MetricsTable
              std={std}
              values={visit.footRight}
              status={visit.statusFootRight}
              keys={SIDE_INPUT_KEYS.footRight}
              columns={3}
              label="Chân Phải (Cp)"
              highlight
            />
          </div>
        </div>
      )}

      <p className={styles.note}>
        Đã sẵn sàng pipeline: CSV / PDF / PNG 300 DPI / In A4.
      </p>
    </section>
  )
}
