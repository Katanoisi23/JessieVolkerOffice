import { useState } from 'react'
import { Experience } from './components/3d/Experience'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { useOfficeStore } from './stores/useOfficeStore'

export default function App() {
  const isLocked = useOfficeStore((state) => state.isLocked)
  const isAppLoaded = useOfficeStore((state) => state.isAppLoaded)
  const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)
  const selectedCaseId = useOfficeStore((state) => state.selectedCaseId)
  const isProjectorOn = useOfficeStore((state) => state.isProjectorOn)
  const isRadioFocused = useOfficeStore((state) => state.isRadioFocused)
  const isComputerFocused = useOfficeStore((state) => state.isComputerFocused)
  const isScreenFocused = useOfficeStore((state) => state.isScreenFocused)
  const hasEntered = useOfficeStore((state) => state.hasEntered)
  const setHasEntered = useOfficeStore((state) => state.setHasEntered)

  const isInteracting = isRadioFocused || isComputerFocused || isScreenFocused

  const handleEnter = () => {
    setHasEntered(true)
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.requestPointerLock()
    }
  }

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Прелоадер с логотипом Jessie Volker Studio */}
      <LoadingScreen />

      {/* 3D Сцена */}
      <Experience />

      {/* Стартовая плашка: показывается СТРОГО в самом начале после прелоадера */}
      {!hasEntered && isAppLoaded && !isInteracting && (
        <div
          className="entrance-overlay"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Заголовок в стиле референса */}
          <h1 className="entrance-heading">
            Jessie Volker Studio
          </h1>

          {/* Карточка CONTROLS */}
          <div className="entrance-card">
            <div className="controls-label">Controls</div>

            <div className="controls-list">
              {/* W A S D */}
              <div className="controls-row">
                <div className="controls-keys">
                  <span className="keycap">W</span>
                  <span className="keycap">A</span>
                  <span className="keycap">S</span>
                  <span className="keycap">D</span>
                </div>
                <div className="controls-desc">
                  Walk around
                  <span className="controls-desc-sub">· arrow keys too</span>
                </div>
              </div>

              {/* Look around */}
              <div className="controls-row">
                <div className="controls-keys">
                  <span className="keycap" style={{ minWidth: '36px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="7" />
                      <line x1="12" y1="6" x2="12" y2="10" />
                    </svg>
                  </span>
                </div>
                <div className="controls-desc">
                  Look around
                </div>
              </div>

              {/* Shift */}
              <div className="controls-row">
                <div className="controls-keys">
                  <span className="keycap" style={{ minWidth: '50px' }}>Shift</span>
                </div>
                <div className="controls-desc">
                  Go faster
                </div>
              </div>

              {/* E */}
              <div className="controls-row">
                <div className="controls-keys">
                  <span className="keycap keycap-highlight">E</span>
                </div>
                <div className="controls-desc">
                  Interact
                  <span className="controls-desc-sub">· near highlighted objects</span>
                </div>
              </div>

              {/* Esc */}
              <div className="controls-row">
                <div className="controls-keys">
                  <span className="keycap" style={{ minWidth: '40px' }}>Esc</span>
                </div>
                <div className="controls-desc">
                  Release the cursor
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка входа в стиле Jessie Volker Studio (Голубой / Циан) */}
          <button
            type="button"
            className="entrance-pill-button"
            onClick={handleEnter}
          >
            <span>Enter the office</span>
            <span style={{ fontSize: '15px' }}>→</span>
          </button>

          {/* Подпись внизу */}
          <div className="entrance-footer-link">
            The studio behind this office <span>jessievolker.studio</span> ↗
          </div>
        </div>
      )}

      {/* Индикатор выбранного кейса и статуса проектора */}
      {isLocked && selectedCaseId !== null && (
        <div className="status-badge-bottom-left">
          <span style={{ color: '#fbbf24' }}>🧲 Кейс #{selectedCaseId} выбран</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>Проектор: {isProjectorOn ? '🟢 Трансляция' : '⚪ Ожидание (нажмите E у проектора)'}</span>
        </div>
      )}

      {/* Статус радио */}
      {isLocked && (
        <div className="status-badge-bottom-right">
          Радио: {isRadioPlaying ? '🟢 Включено' : '🔴 Выключено'}
        </div>
      )}
    </main >
  )
}