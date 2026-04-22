import type { MetricsSet, MetricsStatus, AgeGroupStandards } from '../../types'
import { getLevelColor } from '../../utils/alertRules'
import type { MetricKey } from '../../data/standards'
import { METRICS_KEYS } from '../../data/standards'
import styles from './MetricsTable.module.css'

interface Props {
  std: AgeGroupStandards
  values?: MetricsSet
  status?: MetricsStatus
  label?: string
  highlight?: boolean
  keys?: readonly MetricKey[]
  columns?: number
  labelOverrides?: Partial<Record<MetricKey, string>>
}

export default function MetricsTable({
  std,
  values,
  status,
  label,
  highlight,
  keys,
  columns,
  labelOverrides,
}: Props) {
  const renderKeys = keys ?? METRICS_KEYS
  const cols = columns ?? renderKeys.length

  return (
    <div className={`${styles.wrap} ${highlight ? styles.highlight : ''}`}>
      {label && <div className={styles.tableLabel}>{label}</div>}
      <div className={styles.table} style={{ ['--cols' as string]: cols }}>
        {renderKeys.map((key: MetricKey) => {
          const range = std[key]
          const val = values?.[key]
          const lvl = status?.[key]
          const color = lvl ? getLevelColor(lvl) : undefined
          const displayLabel = labelOverrides?.[key] ?? range.label
          return (
            <div key={key} className={styles.cell}>
              <div className={styles.colLabel}>{displayLabel}</div>
              <div className={styles.colUnit}>{range.unit}</div>
              <div className={styles.colStd}>
                {range.min}–{range.max}
              </div>
              {values !== undefined && (
                <div
                  className={styles.colVal}
                  style={color ? { color } : undefined}
                >
                  {val !== null && val !== undefined ? val : '—'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
