import type { AgeGroupStandards } from '../types'

// Bảng ngưỡng tiêu chuẩn theo nhóm tuổi
// Nguồn: tham chiếu từ tài liệu Khí Công Y Đạo (có thể chỉnh trong file này)
export const STANDARDS: AgeGroupStandards[] = [
  {
    ageGroup: 'Trẻ em (0–12)',
    tt: { label: 'TT', min: 80, max: 110, unit: 'mmHg' },
    ttr: { label: 'TTr', min: 50, max: 70, unit: 'mmHg' },
    nt: { label: 'NT', min: 70, max: 100, unit: 'lần/ph' },
    dh: { label: 'ĐH', min: 3.9, max: 7.0, unit: 'mmol/L' },
    tempForehead: { label: 'Nhiệt Trán', min: 36.1, max: 37.2, unit: '°C' },
    tempHand: { label: 'Nhiệt Tay', min: 35.5, max: 37.0, unit: '°C' },
    tempFoot: { label: 'Nhiệt Chân', min: 35.0, max: 36.8, unit: '°C' },
    ph: { label: 'pH', min: 7.35, max: 7.45, unit: '' },
  },
  {
    ageGroup: 'Thanh thiếu niên (13–17)',
    tt: { label: 'TT', min: 90, max: 120, unit: 'mmHg' },
    ttr: { label: 'TTr', min: 60, max: 80, unit: 'mmHg' },
    nt: { label: 'NT', min: 60, max: 100, unit: 'lần/ph' },
    dh: { label: 'ĐH', min: 3.9, max: 7.8, unit: 'mmol/L' },
    tempForehead: { label: 'Nhiệt Trán', min: 36.1, max: 37.2, unit: '°C' },
    tempHand: { label: 'Nhiệt Tay', min: 35.5, max: 37.0, unit: '°C' },
    tempFoot: { label: 'Nhiệt Chân', min: 35.0, max: 36.8, unit: '°C' },
    ph: { label: 'pH', min: 7.35, max: 7.45, unit: '' },
  },
  {
    ageGroup: 'Người lớn (18–59)',
    tt: { label: 'TT', min: 90, max: 140, unit: 'mmHg' },
    ttr: { label: 'TTr', min: 60, max: 90, unit: 'mmHg' },
    nt: { label: 'NT', min: 60, max: 100, unit: 'lần/ph' },
    dh: { label: 'ĐH', min: 3.9, max: 7.8, unit: 'mmol/L' },
    tempForehead: { label: 'Nhiệt Trán', min: 36.1, max: 37.2, unit: '°C' },
    tempHand: { label: 'Nhiệt Tay', min: 35.5, max: 37.0, unit: '°C' },
    tempFoot: { label: 'Nhiệt Chân', min: 35.0, max: 36.8, unit: '°C' },
    ph: { label: 'pH', min: 7.35, max: 7.45, unit: '' },
  },
  {
    ageGroup: 'Người cao tuổi (60+)',
    tt: { label: 'TT', min: 90, max: 150, unit: 'mmHg' },
    ttr: { label: 'TTr', min: 60, max: 90, unit: 'mmHg' },
    nt: { label: 'NT', min: 55, max: 100, unit: 'lần/ph' },
    dh: { label: 'ĐH', min: 4.4, max: 7.8, unit: 'mmol/L' },
    tempForehead: { label: 'Nhiệt Trán', min: 35.8, max: 37.2, unit: '°C' },
    tempHand: { label: 'Nhiệt Tay', min: 35.0, max: 36.8, unit: '°C' },
    tempFoot: { label: 'Nhiệt Chân', min: 34.5, max: 36.5, unit: '°C' },
    ph: { label: 'pH', min: 7.35, max: 7.45, unit: '' },
  },
]

export function getStandardByAge(age: number): AgeGroupStandards {
  if (age <= 12) return STANDARDS[0]
  if (age <= 17) return STANDARDS[1]
  if (age <= 59) return STANDARDS[2]
  return STANDARDS[3]
}

export const METRICS_KEYS = [
  'tt',
  'ttr',
  'nt',
  'dh',
  'tempForehead',
  'tempHand',
  'tempFoot',
  'ph',
] as const
export type MetricKey = (typeof METRICS_KEYS)[number]
