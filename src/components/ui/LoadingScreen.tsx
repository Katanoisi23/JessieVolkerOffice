import { useEffect, useState, useRef } from 'react'
import { useProgress } from '@react-three/drei'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { preloadAllAssets } from '../../utils/assetsPreloader'

export function LoadingScreen() {
    const { progress, active, loaded, total } = useProgress()
    const setIsAppLoaded = useOfficeStore((state) => state.setIsAppLoaded)
    const [displayProgress, setDisplayProgress] = useState(0)
    const [isAssetsLoaded, setIsAssetsLoaded] = useState(false)
    const [isBlackout, setIsBlackout] = useState(false)
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    const animationFrameRef = useRef<number | null>(null)
    const targetProgressRef = useRef(0)
    const hasTriggeredRef = useRef(false)
    const hasDoorPlayedRef = useRef(false)
    const hasFinishedEntranceRef = useRef(false)
    const stepsAudioRef = useRef<HTMLAudioElement | null>(null)
    const doorAudioRef = useRef<HTMLAudioElement | null>(null)

    // Запускаем полную предзагрузку моделей и текстур на старте
    useEffect(() => {
        preloadAllAssets()
    }, [])

    // Создаем аудио-объекты один раз
    useEffect(() => {
        const steps = new Audio('/audio/steps-2.mp3')
        const door = new Audio('/audio/openingBoo.mp3')
        steps.preload = 'auto'
        door.preload = 'auto'
        steps.volume = 0.85
        door.volume = 0.9

        stepsAudioRef.current = steps
        doorAudioRef.current = door

        return () => {
            steps.pause()
            door.pause()
            steps.src = ''
            door.src = ''
        }
    }, [])

    // Синхронизируем целевой прогресс загрузки
    useEffect(() => {
        const calculated = Math.max(progress, total > 0 ? (loaded / total) * 100 : 0)
        targetProgressRef.current = Math.max(targetProgressRef.current, calculated)
    }, [progress, loaded, total])

    // Плавная интерполяция шкалы (lerp) без скачков
    useEffect(() => {
        const updateProgress = () => {
            setDisplayProgress((prev) => {
                const target = targetProgressRef.current
                const diff = target - prev
                const next = prev + diff * 0.08
                if (Math.abs(target - next) < 0.2) {
                    return target
                }
                return next
            })
            animationFrameRef.current = requestAnimationFrame(updateProgress)
        }

        animationFrameRef.current = requestAnimationFrame(updateProgress)
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        }
    }, [])

    // Флаг готовности ассетов: фиксируется один раз, чтобы не было мерцаний/скачков
    useEffect(() => {
        if (isAssetsLoaded) return
        const isReady = (progress >= 100 || (!active && total > 0 && loaded >= total)) && displayProgress >= 99
        if (isReady) {
            setIsAssetsLoaded(true)
        }
    }, [progress, active, total, loaded, displayProgress, isAssetsLoaded])

    // Fallback таймер: если сеть закеширована или загрузка завершилась мгновенно
    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            targetProgressRef.current = 100
            setIsAssetsLoaded(true)
        }, 3500)
        return () => clearTimeout(fallbackTimer)
    }, [])

    // Функция завершения: открываем сцену и плавно растворяем черный экран
    const finishEntrance = () => {
        if (hasFinishedEntranceRef.current) return
        hasFinishedEntranceRef.current = true
        setIsAppLoaded(true)
        setIsFadingOut(true)
        setTimeout(() => {
            setIsFinished(true)
        }, 800)
    }

    // Запуск звуковой секвенции:
    // гасим экран в черный -> ПАУЗА (2 сек) -> звук шагов -> ПАУЗА (2 сек) -> звук двери (строго 1 раз) -> ПАУЗА (1.5 сек) -> появление сцены
    const startEntranceSequence = () => {
        if (hasTriggeredRef.current) return
        hasTriggeredRef.current = true

        // 1. Немедленно гасим экран в черный
        setIsBlackout(true)

        const steps = stepsAudioRef.current
        const door = doorAudioRef.current

        const triggerFinishWithPause = () => {
            if (hasFinishedEntranceRef.current) return
            // Пауза после звука двери перед появлением сцены (1.5 секунды)
            setTimeout(() => {
                finishEntrance()
            }, 1500)
        }

        const playDoor = () => {
            // Гарантируем, что звук двери проиграется СТРОГО один раз
            if (hasDoorPlayedRef.current || !door) return
            hasDoorPlayedRef.current = true

            door.currentTime = 0
            door
                .play()
                .then(() => {
                    door.onended = () => {
                        triggerFinishWithPause()
                    }
                })
                .catch(() => {
                    triggerFinishWithPause()
                })

            // Резервный таймер завершения звука двери с учетом паузы (~0.76 сек звук + 1.5 сек пауза)
            setTimeout(() => {
                triggerFinishWithPause()
            }, 2350)
        }

        const triggerDoorWithPause = () => {
            if (hasDoorPlayedRef.current) return
            // Пауза после шагов перед открытием двери (2 секунды)
            setTimeout(() => {
                playDoor()
            }, 2000)
        }

        // Пауза 2 секунды в полной темноте перед началом шагов
        setTimeout(() => {
            if (steps) {
                steps.currentTime = 0
                steps
                    .play()
                    .then(() => {
                        steps.onended = () => {
                            triggerDoorWithPause()
                        }
                        // Резервный таймер шагов с учетом паузы (~1.33 сек звук + 2.0 сек пауза)
                        setTimeout(() => {
                            if (!hasDoorPlayedRef.current) {
                                triggerDoorWithPause()
                            }
                        }, 3400)
                    })
                    .catch(() => {
                        triggerDoorWithPause()
                    })
            } else {
                triggerDoorWithPause()
            }
        }, 2000)
    }

    // Слушатель нажатия ЛЮБОЙ кнопки мыши или клавиши клавиатуры ПОСЛЕ 100% загрузки
    useEffect(() => {
        if (!isAssetsLoaded || hasTriggeredRef.current) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (hasTriggeredRef.current) return
            e.preventDefault()
            startEntranceSequence()
        }

        const handlePointerDown = () => {
            if (hasTriggeredRef.current) return
            startEntranceSequence()
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('pointerdown', handlePointerDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('pointerdown', handlePointerDown)
        }
    }, [isAssetsLoaded])

    if (isFinished) return null

    const roundedProgress = Math.min(100, Math.max(0, Math.round(displayProgress)))

    return (
        <div
            onClick={() => {
                if (isAssetsLoaded && !hasTriggeredRef.current) {
                    startEntranceSequence()
                }
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#000000',
                backgroundImage: isBlackout ? 'none' : 'radial-gradient(ellipse at center, #141c29 0%, #0C1017 72%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                userSelect: 'none',
                opacity: isFadingOut ? 0 : 1,
                pointerEvents: isFadingOut ? 'none' : 'auto',
                cursor: isAssetsLoaded && !hasTriggeredRef.current ? 'pointer' : 'default',
                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
            }}
        >
            {/* Центрированный брендинг Jessie Volker Studio */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '320px',
                    padding: '0 20px',
                    boxSizing: 'border-box',
                    opacity: isBlackout ? 0 : 1,
                    transition: 'opacity 0.2s ease-out',
                }}
            >
                {/* Векторный фирменный логотип-знак Jessie Volker */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}
                >
                    {/* Мягкое свечение позади логотипа */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '110px',
                            height: '110px',
                            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(56, 189, 248, 0) 70%)',
                            filter: 'blur(16px)',
                            pointerEvents: 'none',
                        }}
                    />

                    <svg
                        width="84"
                        height="68"
                        viewBox="300 0 625 540"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            filter: 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.4))',
                            display: 'block',
                        }}
                    >
                        {/* Левая грань (Cyan / Sky) */}
                        <path
                            d="M302.856 89.1696C302.123 87.9158 302.129 86.3635 302.873 85.116L348.19 9.10466C349.743 6.49995 353.522 6.50615 355.067 9.11592L484.667 228.132C486.242 230.793 484.321 234.154 481.226 234.154H389.92C388.498 234.154 387.184 233.4 386.467 232.174L302.856 89.1696Z"
                            fill="#38bdf8"
                        />
                        {/* Центральная грань (Cyan / Sky) */}
                        <path
                            d="M665.042 85.0743L711.854 6.02384C713.43 3.36323 711.509 0.00127491 708.413 0.00123392L615.238 3.52622e-10C613.824 -1.87259e-05 612.515 0.745814 611.796 1.96141L476.386 230.846L425.789 306.387C424.873 307.756 424.892 309.546 425.837 310.895L481.299 390C482.976 392.393 486.574 392.236 488.036 389.706L579.121 232.112L665.042 85.0743Z"
                            fill="#38bdf8"
                        />
                        {/* Правая грань (Чистый белый) */}
                        <path
                            d="M819.712 99.1802C821.318 96.52 819.399 93.1288 816.289 93.1288H746.2C743.154 93.1288 741.227 89.8637 742.703 87.2035L789.576 2.7216C790.281 1.45213 791.62 0.664398 793.073 0.664398H863.667C865.112 0.664398 866.444 1.44262 867.152 2.69998L922.184 100.45C922.879 101.684 922.867 103.193 922.153 104.416L671.28 534.178C670.564 535.405 669.248 536.16 667.826 536.16H563.8C562.387 536.16 561.08 535.416 560.36 534.202L522.115 469.726C521.355 468.446 521.372 466.85 522.159 465.586L571.809 385.788C573.444 383.16 577.322 383.308 578.751 386.053L606.869 440.039C608.31 442.805 612.228 442.928 613.84 440.258L819.712 99.1802Z"
                            fill="#ffffff"
                        />
                    </svg>
                </div>

                {/* Название проекта */}
                <h1
                    style={{
                        margin: 0,
                        padding: 0,
                        color: '#ffffff',
                        fontSize: '20px',
                        fontWeight: 700,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        lineHeight: 1.2,
                    }}
                >
                    Jessie Volker
                </h1>
                <span
                    style={{
                        display: 'block',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.45em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        marginTop: '5px',
                        marginBottom: '36px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                >
                    Studio
                </span>

                {/* Прогресс-бар в стиле референса */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: '280px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Линия трека */}
                    <div
                        style={{
                            width: '100%',
                            height: '3px',
                            backgroundColor: '#1a2332',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Заполняющая полоса с градиентом и неоновым свечением (плавная без конфликтов CSS) */}
                        <div
                            style={{
                                width: `${roundedProgress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 65%, #60a5fa 100%)',
                                borderRadius: '9999px',
                                boxShadow: '0 0 12px rgba(56, 189, 248, 0.75)',
                            }}
                        />
                    </div>

                    {/* Фиксированный контейнер под треком: абсолютная стабильность без малейшего прыжка */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '24px',
                            marginTop: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Статус загрузки */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 2px',
                                opacity: isAssetsLoaded ? 0 : 1,
                                pointerEvents: 'none',
                                transition: 'opacity 0.25s ease-out',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '10px',
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                    color: '#64748b',
                                    fontWeight: 500,
                                }}
                            >
                                Loading the office
                            </span>
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                    fontWeight: 600,
                                    color: '#cbd5e1',
                                    minWidth: '36px',
                                    textAlign: 'right',
                                }}
                            >
                                {roundedProgress}%
                            </span>
                        </div>

                        {/* Текстовое указание войти (проявляется на том же месте без прыжков макета) */}
                        <span
                            style={{
                                position: 'relative',
                                display: 'block',
                                color: '#f8fafc',
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                opacity: isAssetsLoaded ? 0.95 : 0,
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                                transition: 'opacity 0.3s ease-in',
                            }}
                        >
                            Нажмите любую кнопку, чтобы войти
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
