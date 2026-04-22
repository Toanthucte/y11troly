import { create } from 'zustand'
import type {
  Screen,
  PatientProfile,
  MetricsSet,
  VisitData,
  MeasurementSide,
} from '../types'
import { getStandardByAge } from '../data/standards'
import { SIDE_INPUT_KEYS } from '../data/standards'
import { evaluateMetrics } from '../utils/alertRules'

const EMPTY_METRICS: MetricsSet = {
  tt: null,
  ttr: null,
  nt: null,
  dh: null,
  tempForehead: null,
  tempLittleFingerLeft: null,
  tempLittleToeLeft: null,
  ph: null,
}

export type InputSide = MeasurementSide

const SIDE_ORDER: InputSide[] = ['left', 'right', 'footLeft', 'footRight']

interface AppState {
  screen: Screen
  patient: PatientProfile | null
  visitTimeText: string
  visitTimeIso: string
  historyVisits: VisitData[]
  left: MetricsSet
  right: MetricsSet
  footLeft: MetricsSet
  footRight: MetricsSet
  inputSide: InputSide
  inputFieldIndex: number

  // Actions
  setScreen: (s: Screen) => void
  setPatient: (p: PatientProfile) => void
  setVisitTime: (text: string, iso: string) => void
  setMetricValue: (
    side: InputSide,
    key: keyof MetricsSet,
    value: number | null,
  ) => void
  nextField: () => void
  prevField: () => void
  sheetsToken: string | null
  sheetsStatus: 'idle' | 'loading' | 'connected' | 'error'

  goToFirstIncomplete: () => void
  buildVisitData: () => VisitData | null
  addVisitToHistory: (visit: VisitData) => void
  setSheetsToken: (token: string | null) => void
  setSheetsStatus: (status: 'idle' | 'loading' | 'connected' | 'error') => void
  mergeSheetVisits: (visits: VisitData[]) => void
  resetAll: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'intro',
  patient: null,
  visitTimeText: '',
  visitTimeIso: '',
  historyVisits: [],
  sheetsToken: null,
  sheetsStatus: 'idle',
  left: { ...EMPTY_METRICS },
  right: { ...EMPTY_METRICS },
  footLeft: { ...EMPTY_METRICS },
  footRight: { ...EMPTY_METRICS },
  inputSide: 'left',
  inputFieldIndex: 0,

  setScreen: (s) => set({ screen: s }),

  setPatient: (p) => set({ patient: p }),

  setVisitTime: (text, iso) => set({ visitTimeText: text, visitTimeIso: iso }),

  setMetricValue: (side, key, value) => {
    set((state) => ({
      [side]: { ...state[side], [key]: value },
    }))
  },

  nextField: () => {
    const { inputFieldIndex, inputSide } = get()
    const sideFields = SIDE_INPUT_KEYS[inputSide]
    if (inputFieldIndex < sideFields.length - 1) {
      set({ inputFieldIndex: inputFieldIndex + 1 })
    } else {
      const idx = SIDE_ORDER.indexOf(inputSide)
      if (idx < SIDE_ORDER.length - 1) {
        set({ inputSide: SIDE_ORDER[idx + 1], inputFieldIndex: 0 })
      }
    }
  },

  prevField: () => {
    const { inputFieldIndex, inputSide } = get()
    if (inputFieldIndex > 0) {
      set({ inputFieldIndex: inputFieldIndex - 1 })
    } else {
      const idx = SIDE_ORDER.indexOf(inputSide)
      if (idx > 0) {
        const prevSide = SIDE_ORDER[idx - 1]
        set({
          inputSide: prevSide,
          inputFieldIndex: SIDE_INPUT_KEYS[prevSide].length - 1,
        })
      }
    }
  },

  goToFirstIncomplete: () => {
    const { left, right, footLeft, footRight } = get()
    const metricsBySide: Record<InputSide, MetricsSet> = {
      left,
      right,
      footLeft,
      footRight,
    }

    for (const side of SIDE_ORDER) {
      const sideFields = SIDE_INPUT_KEYS[side]
      for (let i = 0; i < sideFields.length; i += 1) {
        const key = sideFields[i]
        if (metricsBySide[side][key] === null) {
          set({ inputSide: side, inputFieldIndex: i })
          return
        }
      }
    }

    set({
      inputSide: 'footRight',
      inputFieldIndex: SIDE_INPUT_KEYS.footRight.length - 1,
    })
  },

  buildVisitData: () => {
    const {
      patient,
      visitTimeText,
      visitTimeIso,
      left,
      right,
      footLeft,
      footRight,
    } = get()
    if (!patient || !visitTimeText) return null
    const std = getStandardByAge(patient.age)
    return {
      visitId: `VST-${Date.now()}`,
      visitTimeText,
      visitTimeIso,
      patient,
      left,
      right,
      footLeft,
      footRight,
      statusLeft: evaluateMetrics(left, std, SIDE_INPUT_KEYS.left),
      statusRight: evaluateMetrics(right, std, SIDE_INPUT_KEYS.right),
      statusFootLeft: evaluateMetrics(footLeft, std, SIDE_INPUT_KEYS.footLeft),
      statusFootRight: evaluateMetrics(
        footRight,
        std,
        SIDE_INPUT_KEYS.footRight,
      ),
    }
  },

  addVisitToHistory: (visit) => {
    set((state) => {
      const existingIndex = state.historyVisits.findIndex(
        (item) =>
          item.visitTimeIso === visit.visitTimeIso &&
          item.patient.fullName === visit.patient.fullName &&
          item.patient.phone === visit.patient.phone,
      )

      if (existingIndex >= 0) {
        const next = [...state.historyVisits]
        next[existingIndex] = visit
        return { historyVisits: next }
      }

      return { historyVisits: [visit, ...state.historyVisits] }
    })
  },

  setSheetsToken: (token) => set({ sheetsToken: token }),

  setSheetsStatus: (status) => set({ sheetsStatus: status }),

  mergeSheetVisits: (incoming) => {
    set((state) => {
      const map = new Map<string, VisitData>()
      // Local visits take precedence: add sheets first, then overwrite with local
      for (const v of incoming) map.set(v.visitId, v)
      for (const v of state.historyVisits) map.set(v.visitId, v)
      const merged = Array.from(map.values()).sort((a, b) =>
        b.visitTimeIso.localeCompare(a.visitTimeIso),
      )
      return { historyVisits: merged }
    })
  },

  resetAll: () =>
    set({
      screen: 'khoiA',
      patient: null,
      visitTimeText: '',
      visitTimeIso: '',
      left: { ...EMPTY_METRICS },
      right: { ...EMPTY_METRICS },
      footLeft: { ...EMPTY_METRICS },
      footRight: { ...EMPTY_METRICS },
      inputSide: 'left',
      inputFieldIndex: 0,
    }),
}))
