import type {
  MetricsSet,
  MetricsStatus,
  AlertLevel,
  AgeGroupStandards,
} from '../types'
import type { MetricKey } from '../data/standards'
import { METRICS_KEYS } from '../data/standards'

function classifyValue(
  value: number | null,
  min: number,
  max: number,
): AlertLevel {
  if (value === null) return 'normal'
  const range = max - min
  const margin = range * 0.1
  if (value >= min && value <= max) return 'normal'
  if (value >= min - margin && value <= max + margin) return 'watch'
  return 'alert'
}

function classifyByKey(
  metrics: MetricsSet,
  std: AgeGroupStandards,
  key: MetricKey,
): AlertLevel {
  if (key === 'tt') return classifyValue(metrics.tt, std.tt.min, std.tt.max)
  if (key === 'ttr') return classifyValue(metrics.ttr, std.ttr.min, std.ttr.max)
  if (key === 'nt') return classifyValue(metrics.nt, std.nt.min, std.nt.max)
  if (key === 'dh') return classifyValue(metrics.dh, std.dh.min, std.dh.max)
  if (key === 'tempForehead')
    return classifyValue(
      metrics.tempForehead,
      std.tempForehead.min,
      std.tempForehead.max,
    )
  if (key === 'tempLittleFingerLeft')
    return classifyValue(
      metrics.tempLittleFingerLeft,
      std.tempLittleFingerLeft.min,
      std.tempLittleFingerLeft.max,
    )
  if (key === 'tempLittleToeLeft')
    return classifyValue(
      metrics.tempLittleToeLeft,
      std.tempLittleToeLeft.min,
      std.tempLittleToeLeft.max,
    )
  return classifyValue(metrics.ph, std.ph.min, std.ph.max)
}

export function evaluateMetrics(
  metrics: MetricsSet,
  std: AgeGroupStandards,
  keys: readonly MetricKey[] = METRICS_KEYS,
): MetricsStatus {
  const map: Record<MetricKey, AlertLevel> = {
    tt: 'normal',
    ttr: 'normal',
    nt: 'normal',
    dh: 'normal',
    tempForehead: 'normal',
    tempLittleFingerLeft: 'normal',
    tempLittleToeLeft: 'normal',
    ph: 'normal',
  }

  for (const key of keys) {
    map[key] = classifyByKey(metrics, std, key)
  }

  const levels = keys.map((k) => map[k]) as AlertLevel[]
  const overall: AlertLevel = levels.includes('alert')
    ? 'alert'
    : levels.includes('watch')
      ? 'watch'
      : 'normal'

  return { ...map, overall }
}

export function getLevelColor(level: AlertLevel): string {
  if (level === 'alert') return 'var(--color-alert)'
  if (level === 'watch') return 'var(--color-watch)'
  return 'var(--color-normal)'
}

export function getLevelLabel(level: AlertLevel): string {
  if (level === 'alert') return 'Cảnh báo'
  if (level === 'watch') return 'Cần theo dõi'
  return 'Bình thường'
}

export { METRICS_KEYS }
