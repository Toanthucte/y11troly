import type { Screen } from '../../types'
import { useAppStore } from '../../state/store'
import styles from './AppNav.module.css'

const NAV_ITEMS: { screen: Screen | 'home'; label: string; icon: string }[] = [
  { screen: 'home', label: 'Home', icon: '⌂' },
  { screen: 'export', label: 'Kết xuất', icon: '⬇' },
  { screen: 'history', label: 'Lịch sử', icon: '📋' },
  { screen: 'settings', label: 'Cài đặt', icon: '⚙' },
]

export default function AppNav() {
  const { screen, setScreen, resetAll } = useAppStore()

  function handleNav(item: (typeof NAV_ITEMS)[number]) {
    if (item.screen === 'home') {
      resetAll()
    } else {
      setScreen(item.screen as Screen)
    }
  }

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.screen}
          className={`${styles.navBtn} ${screen === item.screen ? styles.active : ''}`}
          onClick={() => handleNav(item)}
          title={item.label}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
