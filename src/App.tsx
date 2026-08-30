import { Experience } from './components/3d/Experience'
import { useOfficeStore } from './stores/useOfficeStore'

export default function App() {
  const isLocked = useOfficeStore((state) => state.isLocked)
  const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Сцена */}
      <Experience />

      {/* Прицел по центру */}
      {isLocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-2 h-2 bg-white/80 rounded-full ring-2 ring-black/50" />
        </div>
      )}

      {/* Стартовая плашка (pointer-events-none пропускает клик прямо в Canvas) */}
      {!isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white pointer-events-none select-none">
          <div className="max-w-md p-6 bg-neutral-900/90 border border-neutral-800 rounded-xl text-center shadow-2xl">
            <h1 className="text-xl font-bold mb-2">3D Офис-Портфолио</h1>
            <p className="text-sm text-neutral-400 mb-6">
              Кликните по экрану для входа.<br />
              <span className="text-neutral-200 font-mono">WASD</span> — ходьба, <span className="text-neutral-200 font-mono">Мышь</span> — обзор, <span className="text-neutral-200 font-mono">ESC</span> — выход.
            </p>
            <div className="px-5 py-2.5 bg-emerald-600 rounded-lg text-sm font-medium inline-block shadow-lg shadow-emerald-900/30">
              Кликните для входа
            </div>
          </div>
        </div>
      )}

      {/* Статус радио */}
      {isLocked && (
        <div className="absolute bottom-4 right-4 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 z-10 pointer-events-none">
          Радио: {isRadioPlaying ? '🟢 Включено' : '🔴 Выключено'}
        </div>
      )}
    </main>
  )
}