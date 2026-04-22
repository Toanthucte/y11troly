import { useEffect, useMemo, useState } from 'react'
import MetricsTable from '../../components/MetricsTable/MetricsTable'
import { SIDE_INPUT_KEYS } from '../../data/standards'
import type { MetricKey } from '../../data/standards'
import { getStandardByAge } from '../../data/standards'
import { useAppStore } from '../../state/store'
import {
  loadSheetsConfig,
  saveSheetsConfig,
  requestAccessToken,
  fetchVisitsFromSheet,
} from '../../services/sheets/sheetsService'
import styles from './S40History.module.css'

const LEFT_LABEL_OVERRIDES: Partial<Record<MetricKey, string>> = {
  tempLittleFingerLeft: 'NTÚ(T)',
  tempLittleToeLeft: 'NCÚ(T)',
}

const LIMIT_OPTIONS = [10, 20, 50] as const

export default function S40History() {
  const historyVisits = useAppStore((s) => s.historyVisits)
  const sheetsToken = useAppStore((s) => s.sheetsToken)
  const sheetsStatus = useAppStore((s) => s.sheetsStatus)
  const setSheetsToken = useAppStore((s) => s.setSheetsToken)
  const setSheetsStatus = useAppStore((s) => s.setSheetsStatus)
  const mergeSheetVisits = useAppStore((s) => s.mergeSheetVisits)

  const [limit, setLimit] = useState<(typeof LIMIT_OPTIONS)[number]>(20)
  const [clientId, setClientId] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  const [sheetFetching, setSheetFetching] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [sheetLoadedCount, setSheetLoadedCount] = useState(0)

  // Load saved config from localStorage on mount
  useEffect(() => {
    const cfg = loadSheetsConfig()
    if (cfg) {
      setClientId(cfg.clientId)
      setSpreadsheetId(cfg.spreadsheetId)
    }
  }, [])

  async function handleConnect() {
    if (!clientId.trim() || !spreadsheetId.trim()) {
      setConfigOpen(true)
      setSheetError('Vui lòng nhập Client ID và Spreadsheet ID trước.')
      return
    }
    setSheetsStatus('loading')
    setSheetError('')
    try {
      saveSheetsConfig({
        clientId: clientId.trim(),
        spreadsheetId: spreadsheetId.trim(),
      })
      const token = await requestAccessToken(clientId.trim())
      setSheetsToken(token)
      setSheetsStatus('connected')
    } catch (e) {
      setSheetsStatus('error')
      setSheetError(e instanceof Error ? e.message : 'Lỗi kết nối Google')
      setSheetsToken(null)
    }
  }

  async function handleFetchFromSheets() {
    if (!sheetsToken) return
    const cfg = loadSheetsConfig()
    if (!cfg) return
    setSheetFetching(true)
    setSheetError('')
    try {
      const visits = await fetchVisitsFromSheet(sheetsToken, cfg.spreadsheetId)
      mergeSheetVisits(visits)
      setSheetLoadedCount(visits.length)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải dữ liệu'
      if (msg.includes('401') || msg.includes('UNAUTHENTICATED')) {
        setSheetsToken(null)
        setSheetsStatus('idle')
        setSheetError('Phiên đăng nhập hết hạn. Vui lòng kết nối lại.')
      } else {
        setSheetError(msg)
      }
    } finally {
      setSheetFetching(false)
    }
  }

  function handleDisconnect() {
    setSheetsToken(null)
    setSheetsStatus('idle')
    setSheetLoadedCount(0)
    setSheetError('')
  }

  const displayedVisits = useMemo(() => {
    return historyVisits.slice(0, limit)
  }, [historyVisits, limit])

  return (
    <section className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Lịch sử</h2>
          <p className={styles.subtitle}>
            {historyVisits.length} lần đo trong phiên
            {sheetLoadedCount > 0 && ` · ${sheetLoadedCount} từ Sheets`}
          </p>
        </div>

        <div className={styles.limitBox}>
          {LIMIT_OPTIONS.map((option) => (
            <button
              key={option}
              className={`${styles.limitBtn} ${limit === option ? styles.limitBtnActive : ''}`}
              onClick={() => setLimit(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* ── Google Sheets panel ── */}
      <div className={styles.sheetsPanel}>
        <div className={styles.sheetsPanelTop}>
          <span className={styles.sheetsPanelTitle}>Google Sheets</span>

          {sheetsStatus === 'connected' ? (
            <span className={styles.connectedBadge}>✓ Đã kết nối</span>
          ) : sheetsStatus === 'loading' ? (
            <span className={styles.loadingBadge}>Đang kết nối…</span>
          ) : sheetsStatus === 'error' ? (
            <span className={styles.errorBadge}>Lỗi</span>
          ) : null}

          <button
            className={styles.toggleConfigBtn}
            onClick={() => setConfigOpen((v) => !v)}
          >
            {configOpen ? '▲ Thu gọn' : '⚙ Cấu hình'}
          </button>
        </div>

        {configOpen && (
          <div className={styles.sheetsConfig}>
            <label className={styles.configLabel}>
              OAuth 2.0 Client ID
              <input
                className={styles.configInput}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="...apps.googleusercontent.com"
                autoComplete="off"
              />
            </label>
            <label className={styles.configLabel}>
              Spreadsheet ID
              <input
                className={styles.configInput}
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                autoComplete="off"
              />
            </label>
          </div>
        )}

        <div className={styles.sheetsActions}>
          {sheetsStatus !== 'connected' ? (
            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={sheetsStatus === 'loading'}
            >
              {sheetsStatus === 'loading'
                ? 'Đang kết nối…'
                : '🔑 Kết nối Sheets'}
            </button>
          ) : (
            <>
              <button
                className={styles.fetchBtn}
                onClick={handleFetchFromSheets}
                disabled={sheetFetching}
              >
                {sheetFetching
                  ? 'Đang tải…'
                  : sheetLoadedCount > 0
                    ? `↓ Tải lại từ Sheets (${sheetLoadedCount})`
                    : '↓ Tải từ Sheets'}
              </button>
              <button
                className={styles.disconnectBtn}
                onClick={handleDisconnect}
              >
                Ngắt kết nối
              </button>
            </>
          )}
        </div>

        {sheetError && <div className={styles.sheetError}>{sheetError}</div>}
      </div>

      {/* ── Empty state ── */}
      {displayedVisits.length === 0 && (
        <div className={styles.emptyBox}>
          Chưa có dữ liệu. Hoàn tất 1 ca đo và bấm &ldquo;Xuất CSV ngay&rdquo;
          để lưu bản ghi, hoặc bấm &ldquo;Tải từ Sheets&rdquo; nếu đã kết nối.
        </div>
      )}

      {displayedVisits.map((visit, index) => {
        const std = getStandardByAge(visit.patient.age)
        return (
          <article
            key={`${visit.visitId}-${index}`}
            className={styles.visitCard}
          >
            <div className={styles.visitMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Benh nhan</span>
                <span className={styles.metaValue}>
                  {visit.patient.fullName}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tuoi</span>
                <span className={styles.metaValue}>{visit.patient.age}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Thoi gian</span>
                <span className={styles.metaValue}>{visit.visitTimeText}</span>
              </div>
            </div>

            <MetricsTable std={std} label="Tieu chuan" columns={4} />

            <MetricsTable
              std={std}
              values={visit.left}
              status={visit.statusLeft}
              label="Tay Trai (Tt)"
              columns={4}
              labelOverrides={LEFT_LABEL_OVERRIDES}
              highlight
            />

            <MetricsTable
              std={std}
              values={visit.right}
              status={visit.statusRight}
              keys={SIDE_INPUT_KEYS.right}
              columns={3}
              label="Tay Phai (Tp)"
              highlight
            />

            <MetricsTable
              std={std}
              values={visit.footLeft}
              status={visit.statusFootLeft}
              keys={SIDE_INPUT_KEYS.footLeft}
              columns={3}
              label="Chan Trai (Ct)"
              highlight
            />

            <MetricsTable
              std={std}
              values={visit.footRight}
              status={visit.statusFootRight}
              keys={SIDE_INPUT_KEYS.footRight}
              columns={3}
              label="Chan Phai (Cp)"
              highlight
            />
          </article>
        )
      })}
    </section>
  )
}
