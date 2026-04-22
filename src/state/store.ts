import { create } from 'zustand'
import type { Screen, PatientProfile, MetricsSet, VisitData } from '../types'
import { getStandardByAge } from '../data/standards'
import { METRICS_KEYS } from '../data/standards'
import { evaluateMetrics } from '../utils/alertRules'

const EMPTY_METRICS: MetricsSet = {
  tt: null,
  ttr: null,
  nt: null,
  dh: null,
  tempForehead: null,
  tempHand: null,
  tempFoot: null,
  ph: null,
}

export type InputSide = 'left' | 'right' | 'footLeft' | 'footRight'

const SIDE_ORDER: InputSide[] = ['left', 'right', 'footLeft', 'footRight']

interface AppState {
  screen: Screen
  patient: PatientProfile | null
  visitTimeText: string
  visitTimeIso: string
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
  goToFirstIncomplete: () => void
  buildVisitData: () => VisitData | null
  resetAll: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'intro',
  patient: null,
  visitTimeText: '',
  visitTimeIso: '',
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
    if (inputFieldIndex < 7) {
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
        set({ inputSide: SIDE_ORDER[idx - 1], inputFieldIndex: 7 })
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
      for (let i = 0; i < 8; i += 1) {
        const key = METRICS_KEYS[i]
        if (metricsBySide[side][key] === null) {
          set({ inputSide: side, inputFieldIndex: i })
          return
        }
      }
    }

    set({ inputSide: 'footRight', inputFieldIndex: 7 })
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
      statusLeft: evaluateMetrics(left, std),
      statusRight: evaluateMetrics(right, std),
      statusFootLeft: evaluateMetrics(footLeft, std),
      statusFootRight: evaluateMetrics(footRight, std),
    }
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
