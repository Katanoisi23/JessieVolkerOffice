import { Experience } from './components/3d/Experience'
import { useOfficeStore } from './stores/useOfficeStore'

export default function App() {
  const isLocked = useOfficeStore((state) => state.isLocked)
  const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>      {/* 3D Сцена */}
      <Experience />

      {/* Прицел в центре экрана при активной игре */}
      {isLocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-2 h-2 bg-white/70 rounded-full ring-2 ring-black/40" />
        </div>
      )}

      {/* Стартовый оверлей (кликаем, чтобы включить мышь от первого лица) */}
      {!isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm text-white">
          <div className="max-w-md p-6 bg-neutral-900 border border-neutral-800 rounded-xl text-center shadow-2xl">
            <h1 className="text-xl font-bold mb-2">3D Офис-Портфолио</h1>
            <p className="text-sm text-neutral-400 mb-6">
              Нажмите на экран для входа. Управление: <span className="text-white font-mono">WASD</span> для ходьбы, <span className="text-white font-mono">Мышь</span> для обзора, <span className="text-white font-mono">ESC</span> для выхода.
            </p>
            <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-900/30">
              Войти в комнату
            </button>
          </div>
        </div>
      )}

      {/* Статус радио */}
      {isLocked && (
        <div className="absolute bottom-4 right-4 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300">
          Радио: {isRadioPlaying ? '🟢 Включено (Кликните по радио)' : '🔴 Выключено'}
        </div>
      )}
    </main>
  )
}