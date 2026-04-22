import type { MetricsSet, MetricsStatus, AlertLevel, AgeGroupStandards } from '../types'
import type { MetricKey } from '../data/standards'
import { METRICS_KEYS } from '../data/standards'

function classifyValue(value: number | null, min: number, max: number): AlertLevel {
  if (value === null) return 'normal'
  const range = max - min
  const margin = range * 0.1
  if (value >= min && value <= max) return 'normal'
  if (value >= min - margin && value <= max + margin) return 'watch'
  return 'alert'
}

export function evaluateMetrics(metrics: MetricsSet, std: AgeGroupStandards): MetricsStatus {
  const map: Record<MetricKey, AlertLevel> = {
    tt:           classifyValue(metrics.tt,           std.tt.min,           std.tt.max),
    ttr:          classifyValue(metrics.ttr,          std.ttr.min,          std.ttr.max),
    nt:           classifyValue(metrics.nt,           std.nt.min,           std.nt.max),
    dh:           classifyValue(metrics.dh,           std.dh.min,           std.dh.max),
    tempForehead: classifyValue(metrics.tempForehead, std.tempForehead.min, std.tempForehead.max),
    tempHand:     classifyValue(metrics.tempHand,     std.tempHand.min,     std.tempHand.max),
    tempFoot:     classifyValue(metrics.tempFoot,     std.tempFoot.min,     std.tempFoot.max),
    ph:           classifyValue(metrics.ph,           std.ph.min,           std.ph.max),
  }
  const levels = Object.values(map) as AlertLevel[]
  const overall: AlertLevel = levels.includes('alert') ? 'alert'
    : levels.includes('watch') ? 'watch' : 'normal'

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
