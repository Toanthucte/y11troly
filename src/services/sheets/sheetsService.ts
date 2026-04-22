/**
 * Google Sheets integration via REST API + Google Identity Services (GIS).
 * No npm packages required — GIS is loaded via CDN at runtime.
 */

import type { VisitData, PatientProfile, MetricsSet, Sex } from '../../types'
import { getStandardByAge, SIDE_INPUT_KEYS } from '../../data/standards'
import { evaluateMetrics } from '../../utils/alertRules'

// ─── GIS global type declarations ─────────────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (r: { access_token?: string; error?: string }) => void
          }): { requestAccessToken(): void }
        }
      }
    }
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
const SHEET_TAB = 'visits'
const CONFIG_KEY = 'y11_sheets_config'

export const HEADER_FIELDS = [
  'visit_id',
  'full_name',
  'age',
  'sex',
  'phone',
  'visit_time_text',
  'visit_time_iso',
  'left_tt',
  'left_ttr',
  'left_nt',
  'left_dh',
  'left_temp_forehead',
  'left_temp_little_finger',
  'left_temp_little_toe',
  'left_ph',
  'right_tt',
  'right_ttr',
  'right_nt',
  'foot_left_tt',
  'foot_left_ttr',
  'foot_left_nt',
  'foot_right_tt',
  'foot_right_ttr',
  'foot_right_nt',
  'status_left_overall',
  'status_right_overall',
  'status_foot_left_overall',
  'status_foot_right_overall',
] as const

// ─── Config helpers (localStorage) ────────────────────────────────────────────
export interface SheetsConfig {
  clientId: string
  spreadsheetId: string
}

export function loadSheetsConfig(): SheetsConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SheetsConfig
  } catch {
    return null
  }
}

export function saveSheetsConfig(cfg: SheetsConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

// ─── GIS script loader (singleton) ────────────────────────────────────────────
let gisLoaded = false
let gisLoadPromise: Promise<void> | null = null

export function loadGsiScript(): Promise<void> {
  if (gisLoaded) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    if (document.getElementById('gsi-script')) {
      gisLoaded = true
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      gisLoaded = true
      resolve()
    }
    script.onerror = () =>
      reject(new Error('Không tải được Google Identity Services'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export async function requestAccessToken(clientId: string): Promise<string> {
  await loadGsiScript()

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services chưa sẵn sàng'))
      return
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
        } else if (response.access_token) {
          resolve(response.access_token)
        } else {
          reject(new Error('Không nhận được access token'))
        }
      },
    })

    client.requestAccessToken()
  })
}

// ─── Sheets REST API helpers ───────────────────────────────────────────────────
async function sheetsGet(
  token: string,
  spreadsheetId: string,
  range: string,
): Promise<{ values?: string[][] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
    }
    throw new Error(err?.error?.message ?? `Sheets API lỗi ${res.status}`)
  }
  return res.json() as Promise<{ values?: string[][] }>
}

async function sheetsAppend(
  token: string,
  spreadsheetId: string,
  values: (string | number)[][],
): Promise<void> {
  const range = `${SHEET_TAB}!A1`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
    }
    throw new Error(err?.error?.message ?? `Sheets append lỗi ${res.status}`)
  }
}

// ─── Header management ─────────────────────────────────────────────────────────
async function ensureHeader(
  token: string,
  spreadsheetId: string,
): Promise<void> {
  const data = await sheetsGet(token, spreadsheetId, `${SHEET_TAB}!A1:A1`)
  const a1 = data.values?.[0]?.[0]
  if (a1 !== 'visit_id') {
    await sheetsAppend(token, spreadsheetId, [Array.from(HEADER_FIELDS)])
  }
}

// ─── Public: append one visit row ─────────────────────────────────────────────
export async function appendVisitToSheet(
  token: string,
  spreadsheetId: string,
  row: Record<string, string | number>,
): Promise<void> {
  await ensureHeader(token, spreadsheetId)
  const values = [HEADER_FIELDS.map((key) => row[key] ?? '')]
  await sheetsAppend(token, spreadsheetId, values)
}

// ─── Public: fetch & parse all visits ─────────────────────────────────────────
function parseNum(v: string | undefined): number | null {
  if (!v || v.trim() === '') return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function emptyMetrics(): MetricsSet {
  return {
    tt: null,
    ttr: null,
    nt: null,
    dh: null,
    tempForehead: null,
    tempLittleFingerLeft: null,
    tempLittleToeLeft: null,
    ph: null,
  }
}

function rowToVisitData(
  headerMap: Map<string, number>,
  row: string[],
): VisitData | null {
  const get = (key: string): string => row[headerMap.get(key) ?? -1] ?? ''

  const visitId = get('visit_id')
  const age = parseInt(get('age'), 10)
  if (!visitId || isNaN(age)) return null

  const patient: PatientProfile = {
    fullName: get('full_name'),
    age,
    sex: (get('sex') as Sex) || 'other',
    phone: get('phone'),
  }

  const left: MetricsSet = {
    ...emptyMetrics(),
    tt: parseNum(get('left_tt')),
    ttr: parseNum(get('left_ttr')),
    nt: parseNum(get('left_nt')),
    dh: parseNum(get('left_dh')),
    tempForehead: parseNum(get('left_temp_forehead')),
    tempLittleFingerLeft: parseNum(get('left_temp_little_finger')),
    tempLittleToeLeft: parseNum(get('left_temp_little_toe')),
    ph: parseNum(get('left_ph')),
  }
  const right: MetricsSet = {
    ...emptyMetrics(),
    tt: parseNum(get('right_tt')),
    ttr: parseNum(get('right_ttr')),
    nt: parseNum(get('right_nt')),
  }
  const footLeft: MetricsSet = {
    ...emptyMetrics(),
    tt: parseNum(get('foot_left_tt')),
    ttr: parseNum(get('foot_left_ttr')),
    nt: parseNum(get('foot_left_nt')),
  }
  const footRight: MetricsSet = {
    ...emptyMetrics(),
    tt: parseNum(get('foot_right_tt')),
    ttr: parseNum(get('foot_right_ttr')),
    nt: parseNum(get('foot_right_nt')),
  }

  const std = getStandardByAge(age)
  return {
    visitId,
    visitTimeText: get('visit_time_text'),
    visitTimeIso: get('visit_time_iso'),
    patient,
    left,
    right,
    footLeft,
    footRight,
    statusLeft: evaluateMetrics(left, std, SIDE_INPUT_KEYS.left),
    statusRight: evaluateMetrics(right, std, SIDE_INPUT_KEYS.right),
    statusFootLeft: evaluateMetrics(footLeft, std, SIDE_INPUT_KEYS.footLeft),
    statusFootRight: evaluateMetrics(footRight, std, SIDE_INPUT_KEYS.footRight),
  }
}

export async function fetchVisitsFromSheet(
  token: string,
  spreadsheetId: string,
): Promise<VisitData[]> {
  // Use explicit A1 notation. Passing only sheet name can be interpreted as
  // a named range in some cases and may return 404 "Requested entity not found".
  const data = await sheetsGet(token, spreadsheetId, `${SHEET_TAB}!A1:ZZ`)
  const rows = data.values ?? []
  if (rows.length < 2) return []

  const headerMap = new Map(rows[0].map((h, i) => [h, i]))
  const visits: VisitData[] = []

  // Iterate newest-first (bottom of sheet = latest)
  for (let i = rows.length - 1; i >= 1; i--) {
    const visit = rowToVisitData(headerMap, rows[i])
    if (visit) visits.push(visit)
  }

  return visits
}
