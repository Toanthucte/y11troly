import { useAppStore } from './state/store'
import S00Intro from './screens/S00Intro/S00Intro'
import S10KhoiA from './screens/S10KhoiA/S10KhoiA'
import S20KhoiB from './screens/S20KhoiB/S20KhoiB'
import S30Export from './screens/S30Export/S30Export'
import AppNav from './components/AppNav/AppNav'

function App() {
  const screen = useAppStore((s) => s.screen)

  return (
    <>
      {screen === 'intro' && <S00Intro />}
      {screen !== 'intro' && (
        <>
          <main style={{ paddingBottom: 64 }}>
            {screen === 'khoiA' && <S10KhoiA />}
            {screen === 'khoiB' && <S20KhoiB />}
            {screen === 'export' && <S30Export />}
            {screen === 'history' && (
              <div style={{ padding: '24px', color: '#94a3b8' }}>Lịch sử</div>
            )}
            {screen === 'settings' && (
              <div style={{ padding: '24px', color: '#94a3b8' }}>Cài đặt</div>
            )}
          </main>
          <AppNav />
        </>
      )}
    </>
  )
}

export default App
