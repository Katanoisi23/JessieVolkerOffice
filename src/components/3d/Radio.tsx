import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useGLTF, useTexture, Center, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { RADIO_TRACKS } from '../../data/radioTracks'
import { ensureAudioContext } from '../../utils/audioSystem'

interface RadioProps {
    modelPath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    interactionDistance?: number
}

export function Radio({
    modelPath = '/models/radio.glb',
    position = [1.6, 0.85, -4.1],
    rotation = [1.5, -1.6, 1.5],
    targetHeight = 0.25,
    scale = 1,
    interactionDistance = 2.4,
}: RadioProps) {
    const gltf = useGLTF(modelPath)
    const groupRef = useRef<THREE.Group>(null)
    const { camera } = useThree()

    const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)
    const setRadioPlaying = useOfficeStore((state) => state.setRadioPlaying)
    const isRadioFocused = useOfficeStore((state) => state.isRadioFocused)
    const setIsRadioFocused = useOfficeStore((state) => state.setIsRadioFocused)
    const setIsLocked = useOfficeStore((state) => state.setIsLocked)
    const activeInteraction = useOfficeStore((state) => state.activeInteraction)
    const setActiveInteraction = useOfficeStore((state) => state.setActiveInteraction)

    const [isNear, setIsNear] = useState(false)
    const [currentTrackIdx, setCurrentTrackIdx] = useState(0)
    const [volume, setVolume] = useState(65) // Комфортный уровень громкости

    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Векторы для проверки дистанции
    const radioWorldPos = useRef(new THREE.Vector3())
    const camDir = useRef(new THREE.Vector3())
    const toRadio = useRef(new THREE.Vector3())

    // Загрузка текстур
    const textures = useTexture({
        woodDiff: '/textures/radio/OldRadio_Wood_Diffuse.png',
        woodNorm: '/textures/radio/OldRadio_Wood_Normal.png',
        woodRefl: '/textures/radio/OldRadio_Wood_Reflection.png',

        metalDiff: '/textures/radio/OldRadio_Text-Metal_Diffuse.png',
        metalRefl: '/textures/radio/OldRadio_Text-Metal_Reflection.png',

        btnDiff: '/textures/radio/OldRadio_Button_Diffuse.png',
        btnRefl: '/textures/radio/OldRadio_Button_Reflection.png',
    })

    // PBR-материалы
    const materials = useMemo(() => {
        textures.woodDiff.colorSpace = THREE.SRGBColorSpace
        textures.metalDiff.colorSpace = THREE.SRGBColorSpace
        textures.btnDiff.colorSpace = THREE.SRGBColorSpace

        textures.woodDiff.flipY = false
        textures.woodNorm.flipY = false
        textures.woodRefl.flipY = false
        textures.metalDiff.flipY = false
        textures.metalRefl.flipY = false
        textures.btnDiff.flipY = false
        textures.btnRefl.flipY = false

        const woodMat = new THREE.MeshStandardMaterial({
            map: textures.woodDiff,
            normalMap: textures.woodNorm,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
        })

        const metalMat = new THREE.MeshStandardMaterial({
            map: textures.metalDiff,
            metalnessMap: textures.metalRefl,
            metalness: 0.85,
            roughness: 0.25,
            side: THREE.DoubleSide,
            emissive: isRadioPlaying ? new THREE.Color('#38bdf8') : new THREE.Color('#000000'),
            emissiveIntensity: isRadioPlaying ? 0.6 : 0.0,
        })

        const btnMat = new THREE.MeshStandardMaterial({
            map: textures.btnDiff,
            metalnessMap: textures.btnRefl,
            roughness: 0.35,
            metalness: 0.3,
            side: THREE.DoubleSide,
        })

        return { woodMat, metalMat, btnMat }
    }, [textures, isRadioPlaying])

    // Привязка материалов к частям радио
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()

                const resolveMat = (mat: THREE.Material) => {
                    const fullName = `${mesh.name} ${mat.name || ''}`.toLowerCase()

                    if (/btn|button|knob|ручк|кнопк/i.test(fullName)) {
                        return materials.btnMat
                    }
                    if (/metal|text|dial|scale|панел|шкал/i.test(fullName)) {
                        return materials.metalMat
                    }
                    return materials.woodMat
                }

                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map(resolveMat)
                } else if (mesh.material) {
                    mesh.material = resolveMat(mesh.material)
                }
            }
        })

        return scene
    }, [gltf.scene, materials])

    const defaultScale: [number, number, number] = [0.5, 0.5, 0.5]

    const computedScale: [number, number, number] = useMemo(() => {
        if (targetHeight) {
            const box = new THREE.Box3().setFromObject(clonedScene)
            const size = new THREE.Vector3()
            box.getSize(size)
            const currentHeight = size.y || 1
            const factor = targetHeight / currentHeight
            return [factor, factor, factor]
        }
        if (Array.isArray(scale)) return scale
        if (typeof scale === 'number') return [scale, scale, scale]
        return defaultScale
    }, [clonedScene, targetHeight, scale])

    const currentTrack = RADIO_TRACKS[currentTrackIdx] || RADIO_TRACKS[0]

    // Инициализация HTMLAudioElement
    useEffect(() => {
        const audio = new Audio()
        audio.preload = 'auto'
        audioRef.current = audio

        const handleEnded = () => {
            setCurrentTrackIdx((prev) => (prev + 1) % RADIO_TRACKS.length)
        }
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('ended', handleEnded)
            audio.pause()
            audio.src = ''
            audioRef.current = null
        }
    }, [])

    // Аналоговый щелчок тумблера при переключении
    const playPowerClick = useCallback((isOn: boolean) => {
        try {
            const ctx = ensureAudioContext()
            if (!ctx) return
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'triangle'
            osc.frequency.setValueAtTime(isOn ? 380 : 220, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(isOn ? 90 : 60, ctx.currentTime + 0.04)

            gain.gain.setValueAtTime(0.25 * (volume / 100), ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.05)
        } catch { }
    }, [volume])

    // Управление воспроизведением трека
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const targetSrc = currentTrack.url

        if (isRadioPlaying) {
            const ctx = ensureAudioContext()
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {})
            }
            if (!audio.src.endsWith(targetSrc)) {
                audio.src = targetSrc
            }
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('[Radio] Audio playback pending user interaction:', err)
                })
            }
        } else {
            audio.pause()
        }
    }, [isRadioPlaying, currentTrackIdx, currentTrack.url])

    // Переключение питания (POWER ON / OFF)
    const handleTogglePower = useCallback(() => {
        const nextState = !isRadioPlaying
        playPowerClick(nextState)
        setRadioPlaying(nextState)
    }, [isRadioPlaying, setRadioPlaying, playPowerClick])

    // Предыдущий трек / канал
    const handlePrevTrack = useCallback(() => {
        const nextIdx = (currentTrackIdx - 1 + RADIO_TRACKS.length) % RADIO_TRACKS.length
        setCurrentTrackIdx(nextIdx)
        playPowerClick(true)
    }, [currentTrackIdx, playPowerClick])

    // Следующий трек / канал
    const handleNextTrack = useCallback(() => {
        const nextIdx = (currentTrackIdx + 1) % RADIO_TRACKS.length
        setCurrentTrackIdx(nextIdx)
        playPowerClick(true)
    }, [currentTrackIdx, playPowerClick])

    // Открытие фокуса на радио
    const handleOpenRadioFocus = useCallback(() => {
        setIsRadioFocused(true)
        setIsLocked(false)
        document.exitPointerLock?.()
    }, [setIsRadioFocused, setIsLocked])

    // Закрытие фокуса на радио
    const handleCloseRadioFocus = useCallback(() => {
        setIsRadioFocused(false)
    }, [setIsRadioFocused])

    // Отслеживание дистанции персонажа и позиционирование звука радиоприемника
    useFrame(() => {
        if (!groupRef.current) return

        groupRef.current.getWorldPosition(radioWorldPos.current)
        const radioCenterY = radioWorldPos.current.y + 0.12

        const dx = camera.position.x - radioWorldPos.current.x
        const dy = camera.position.y - radioCenterY
        const dz = camera.position.z - radioWorldPos.current.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Плавный реалистичный спад громкости от расстояния:
        // В радиусе рабочего стола (<= 1.4м): громко, отчетливо и комфортно
        // При отходе (> 1.4м): быстрое спадание по плавной квадратичной кривой
        // У дверей/в дальнем углу (>= 7.5м): радио полностью затихает
        if (audioRef.current && isRadioPlaying) {
            const baseVol = (volume / 100) * 0.55 // Мягкий не бьющий по ушам предел громкости
            let distFactor = 0

            if (distance <= 1.4) {
                distFactor = 1.0
            } else if (distance < 7.5) {
                const normalizedDist = (distance - 1.4) / (7.5 - 1.4)
                distFactor = Math.pow(Math.max(0, 1.0 - normalizedDist), 2.2)
            } else {
                distFactor = 0
            }

            const targetVol = Math.min(1.0, Math.max(0, baseVol * distFactor))
            audioRef.current.volume = targetVol
        }

        camera.getWorldDirection(camDir.current)
        toRadio.current.set(-dx, -dy, -dz).normalize()
        const dot = camDir.current.dot(toRadio.current)

        const near = distance <= interactionDistance && dot >= 0.45

        if (near !== isNear) {
            setIsNear(near)
        }

        if (near && !isRadioFocused) {
            if (activeInteraction === null || activeInteraction === 'radio') {
                if (activeInteraction !== 'radio') setActiveInteraction('radio')
            }
        } else {
            if (activeInteraction === 'radio' && !isRadioFocused) {
                setActiveInteraction(null)
            }
        }
    })

    // Горячая клавиша [E] для взаимодействия при приближении
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement
            const isTyping =
                activeEl &&
                (activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.tagName === 'SELECT')

            if (isTyping) return

            if (
                e.code === 'KeyE' ||
                e.key === 'e' ||
                e.key === 'E' ||
                e.key === 'у' ||
                e.key === 'У'
            ) {
                if (isNear && !isRadioFocused) {
                    e.preventDefault()
                    if (!isRadioPlaying) {
                        playPowerClick(true)
                        setRadioPlaying(true)
                    }
                    handleOpenRadioFocus()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNear, isRadioFocused, isRadioPlaying, setRadioPlaying, playPowerClick, handleOpenRadioFocus])

    return (
        <group
            position={position}
            rotation={rotation}
            scale={computedScale}
            ref={groupRef}
            onClick={(e) => {
                e.stopPropagation()
                if (isNear && !isRadioFocused) {
                    if (!isRadioPlaying) {
                        playPowerClick(true)
                        setRadioPlaying(true)
                    }
                    handleOpenRadioFocus()
                }
            }}
            onPointerOver={() => {
                if (isNear) document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto'
            }}
        >
            <Center top>
                <primitive object={clonedScene} />
            </Center>

            {/* Мягкая подсветка радиоприемника при включении */}

            <pointLight
                position={[0, 0.08, 0.12]}
                color="#38bdf8"
                intensity={isRadioPlaying ? 1.4 : 0}
                distance={1.6}
                decay={2}
            />

            {/* 1. ПОДСКАЗКА ПРИ ПРИБЛИЖЕНИИ В СТИЛЕ СВЕТА И ПРОЕКТОРА */}
            {isNear && !isRadioFocused && (
                <Html
                    position={[0, 0.22, 0.05]}
                    center
                    distanceFactor={2.4}
                    zIndexRange={[100, 0]}
                    className="pointer-events-none select-none"
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 14px',
                            borderRadius: '14px',
                            backgroundColor: 'rgba(11, 16, 28, 0.94)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 189, 248, 0.25)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                                style={{
                                    fontSize: '15px',
                                    filter: isRadioPlaying
                                        ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.95))'
                                        : 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.5))',
                                }}
                            >
                                📻
                            </span>
                            <span
                                style={{
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: isRadioPlaying ? '#38bdf8' : '#f8fafc',
                                }}
                            >
                                {isRadioPlaying
                                    ? `РАДИО: ${currentTrack.channel} • ${currentTrack.artist ? `${currentTrack.artist} - ` : ''}${currentTrack.title}`
                                    : 'РАДИО: ВКЛЮЧИТЬ'}
                            </span>
                        </div>

                        <div
                            style={{
                                width: '1px',
                                height: '14px',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                margin: '0 2px',
                            }}
                        />

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: '#94a3b8',
                            }}
                        >
                            <span>press</span>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '20px',
                                    height: '20px',
                                    padding: '0 6px',
                                    borderRadius: '5px',
                                    color: '#333333ff',
                                    fontFamily: 'ui-monospace, monospace',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    lineHeight: 1,
                                    backgroundColor: '#38bdf8d0',
                                    boxShadow: '0 0 8px rgba(56, 189, 248, 0.5)',
                                }}
                            >
                                E
                            </span>
                        </div>
                    </div>
                </Html>
            )}

            {/* 2. ЭКРАННЫЙ ИНТЕРФЕЙС ПЛЕЕРА В ТОЧНОСТИ КАК НА ФОТО ПОЛЬЗОВАТЕЛЯ */}
            {isRadioFocused && (
                <Html fullscreen zIndexRange={[300, 0]} className="select-none">
                    {/* Защитная полноэкранная подложка: удерживает видимый курсор и блокирует захват мыши */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            pointerEvents: 'auto',
                            cursor: 'default',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {/* Виджет управления радио в правом верхнем углу (в точности по фото) */}
                        <div
                            style={{
                                position: 'fixed',
                                top: '20px',
                                right: '20px',
                                width: '210px',
                                backgroundColor: '#161719',
                                borderRadius: '14px',
                                padding: '14px 16px',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 9999,
                            userSelect: 'none',
                        }}
                    >
                        {/* Заголовок: CH1 • SALES - POPE IS A ROCKSTAR */}
                        <div
                            title={`${currentTrack.channel} • ${currentTrack.artist ? `${currentTrack.artist} - ` : ''}${currentTrack.title}`}
                            style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#f3f4f6',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                marginBottom: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                            }}
                        >
                            {`${currentTrack.channel} • ${currentTrack.artist ? `${currentTrack.artist} - ` : ''}${currentTrack.title}`}
                        </div>

                        {/* Статус: OFF / ON */}
                        <div
                            style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: isRadioPlaying ? '#22c55e' : '#888888',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                marginBottom: '12px',
                            }}
                        >
                            {isRadioPlaying ? 'ON' : 'OFF'}
                        </div>

                        {/* Кнопки управления: |<   [ POWER ON ]   >| */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                marginBottom: '12px',
                            }}
                        >
                            {/* Предыдущий трек */}
                            <button
                                onClick={handlePrevTrack}
                                title="Предыдущий трек"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                    transition: 'color 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                            >
                                |◀
                            </button>

                            {/* Кнопка POWER ON / POWER OFF */}
                            <button
                                onClick={handleTogglePower}
                                style={{
                                    backgroundColor: '#0ea5e9',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '16px',
                                    padding: '6px 14px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 10px rgba(14, 165, 233, 0.45)',
                                    transition: 'transform 0.15s ease, background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.04)'
                                    e.currentTarget.style.backgroundColor = '#38bdf8'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.backgroundColor = '#0ea5e9'
                                }}
                            >
                                {isRadioPlaying ? 'POWER OFF' : 'POWER ON'}
                            </button>

                            {/* Следующий трек */}
                            <button
                                onClick={handleNextTrack}
                                title="Следующий трек"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                    transition: 'color 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                            >
                                ▶|
                            </button>
                        </div>

                        {/* Ползунок громкости: VOL [====O====] 70 */}

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    color: '#71717a',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                VOL
                            </span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                                style={{
                                    flex: 1,
                                    height: '3px',
                                    accentColor: '#38bdf8',
                                    cursor: 'pointer',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontFamily: 'ui-monospace, monospace',
                                    color: '#9ca3af',
                                    minWidth: '16px',
                                    textAlign: 'right',
                                }}
                            >
                                {volume}
                            </span>
                        </div>
                    </div>

                    {/* Кнопка выхода внизу по центру: ✕ BACK TO WALKING (Esc) (в точности по фото) */}
                    <button
                        onClick={handleCloseRadioFocus}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(28, 28, 30, 0.9)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '20px',
                            padding: '8px 18px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            cursor: 'pointer',
                            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            zIndex: 9999,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(45, 45, 48, 0.95)'
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1.04)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(28, 28, 30, 0.9)'
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1)'
                        }}
                    >
                        <span>✕</span>
                        <span>BACK TO WALKING (Esc)</span>
                    </button>
                    </div>
                </Html>
            )}
        </group>
    )
}

useGLTF.preload('/models/radio.glb')