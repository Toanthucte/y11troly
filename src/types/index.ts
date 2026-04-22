export type Screen =
  | 'intro'
  | 'khoiA'
  | 'khoiB'
  | 'export'
  | 'history'
  | 'settings'

export type Sex = 'male' | 'female' | 'other'

export interface PatientProfile {
  fullName: string
  age: number
  sex: Sex
  phone: string
}

export type AlertLevel = 'normal' | 'watch' | 'alert'

export interface MetricsSet {
  tt: number | null
  ttr: number | null
  nt: number | null
  dh: number | null
  tempForehead: number | null
  tempHand: number | null
  tempFoot: number | null
  ph: number | null
}

export interface MetricsStatus {
  tt: AlertLevel
  ttr: AlertLevel
  nt: AlertLevel
  dh: AlertLevel
  tempForehead: AlertLevel
  tempHand: AlertLevel
  tempFoot: AlertLevel
  ph: AlertLevel
  overall: AlertLevel
}

export interface VisitData {
  visitId: string
  visitTimeText: string
  visitTimeIso: string
  patient: PatientProfile
  left: MetricsSet
  right: MetricsSet
  footLeft: MetricsSet
  footRight: MetricsSet
  statusLeft: MetricsStatus
  statusRight: MetricsStatus
  statusFootLeft: MetricsStatus
  statusFootRight: MetricsStatus
}

export interface StandardRange {
  label: string
  min: number
  max: number
  unit: string
}

export interface AgeGroupStandards {
  ageGroup: string
  tt: StandardRange
  ttr: StandardRange
  nt: StandardRange
  dh: StandardRange
  tempForehead: StandardRange
  tempHand: StandardRange
  tempFoot: StandardRange
  ph: StandardRange
}
