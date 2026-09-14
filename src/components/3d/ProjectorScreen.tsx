import { useMemo, useRef, useEffect, useState } from 'react'
import { useTexture, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { CASE_ITEMS } from '../../data/cases'

interface ProjectorScreenProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    width?: number
    height?: number
}

// Звуковой эффект фокусировки на экран
function playFocusSound() {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(320, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
    } catch {}
}

export function ProjectorScreen({
    position = [2.02, 1.85, 1.45],
    rotation = [0, -Math.PI / 2, 0],
    width = 2.0,
    height = 1.125, // 16:9 соотношение
}: ProjectorScreenProps) {
    const groupRef = useRef<THREE.Group>(null)
    const screenWorldPos = useRef(new THREE.Vector3())
    const { camera } = useThree()

    const selectedCaseId = useOfficeStore((state) => state.selectedCaseId)
    const isProjectorOn = useOfficeStore((state) => state.isProjectorOn)
    const isRoomLightOn = useOfficeStore((state) => state.isRoomLightOn)
    const isScreenFocused = useOfficeStore((state) => state.isScreenFocused)
    const setIsScreenFocused = useOfficeStore((state) => state.setIsScreenFocused)
    const activeInteraction = useOfficeStore((state) => state.activeInteraction)
    const setActiveInteraction = useOfficeStore((state) => state.setActiveInteraction)

    const [isNear, setIsNear] = useState(false)

    // Загрузка текстур слайдов проектора
    const slideTextures = useTexture({
        idle: '/textures/cases/projector_idle.svg',
        slide1: '/textures/cases/projector_slide_1.svg',
        slide2: '/textures/cases/projector_slide_2.svg',
        slide3: '/textures/cases/projector_slide_3.svg',
        slide4: '/textures/cases/projector_slide_4.svg',
        slide5: '/textures/cases/projector_slide_5.svg',
        slide6: '/textures/cases/projector_slide_6.svg',
    })

    // Настройка цветового пространства текстур
    useMemo(() => {
        Object.values(slideTextures).forEach((tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.flipY = true
            tex.minFilter = THREE.LinearMipmapLinearFilter
            tex.magFilter = THREE.LinearFilter
            tex.generateMipmaps = true
        })
    }, [slideTextures])

    // Определение текущей активной текстуры для проецирования
    const currentTexture = useMemo(() => {
        if (!selectedCaseId) return slideTextures.idle
        switch (selectedCaseId) {
            case 1:
                return slideTextures.slide1
            case 2:
                return slideTextures.slide2
            case 3:
                return slideTextures.slide3
            case 4:
                return slideTextures.slide4
            case 5:
                return slideTextures.slide5
            case 6:
                return slideTextures.slide6
            default:
                return slideTextures.idle
        }
    }, [selectedCaseId, slideTextures])

    // PBR-материал полупрозрачного полотна экрана
    const canvasMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.18,
            roughness: 0.35,
            metalness: 0.05,
            side: THREE.DoubleSide,
            depthWrite: false,
        })
    }, [])

    // Материал полупрозрачной акриловой/стеклянной подложки
    const glassMaterial = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            transmission: 0.8,
            ior: 1.45,
            side: THREE.DoubleSide,
            depthWrite: false,
        })
    }, [])

    // Обновление карты текстуры при смене кейса или статуса проектора
    useEffect(() => {
        if (!canvasMaterial) return
        if (isProjectorOn) {
            canvasMaterial.color.set('#ffffff')
            canvasMaterial.map = currentTexture
            canvasMaterial.emissive.set('#ffffff')
            canvasMaterial.emissiveMap = currentTexture
        } else {
            canvasMaterial.color.set('#f8fafc')
            canvasMaterial.map = null
            canvasMaterial.emissive.set('#000000')
            canvasMaterial.emissiveMap = null
        }
        canvasMaterial.needsUpdate = true
    }, [isProjectorOn, currentTexture, canvasMaterial])

    const camDir = useRef(new THREE.Vector3())
    const toScreen = useRef(new THREE.Vector3())

    // Проверка приближения к экрану и плавная смена прозрачности
    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.getWorldPosition(screenWorldPos.current)
            const distance = camera.position.distanceTo(screenWorldPos.current)

            // Проверяем, направлен ли прицел/взгляд прямо на экран
            camera.getWorldDirection(camDir.current)
            toScreen.current.subVectors(screenWorldPos.current, camera.position).normalize()
            const dot = camDir.current.dot(toScreen.current)

            const isTargeted = distance <= 1.85 && dot >= 0.82

            if (isTargeted && !isScreenFocused) {
                if (activeInteraction === null || activeInteraction === 'screen') {
                    if (activeInteraction !== 'screen') setActiveInteraction('screen')
                    if (!isNear) setIsNear(true)
                }
            } else {
                if (activeInteraction === 'screen') {
                    setActiveInteraction(null)
                }
                if (isNear) setIsNear(false)
            }
        }

        if (!canvasMaterial || !glassMaterial) return
        const step = Math.min(1, delta * 5)

        // Свет включен: больше прозрачности (0.50), стена позади хорошо видна
        // Свет выключен: меньше прозрачности (0.94), насыщенная кинематографичная картинка
        const targetOpacity = !isProjectorOn
            ? (isRoomLightOn ? 0.18 : 0.06)
            : (isRoomLightOn ? 0.50 : 0.94)

        const targetEmissive = !isProjectorOn
            ? 0
            : (isRoomLightOn ? 0.55 : 0.95)

        const targetGlassOpacity = isProjectorOn
            ? (isRoomLightOn ? 0.22 : 0.08)
            : (isRoomLightOn ? 0.15 : 0.05)

        canvasMaterial.opacity = THREE.MathUtils.lerp(canvasMaterial.opacity, targetOpacity, step)
        canvasMaterial.emissiveIntensity = THREE.MathUtils.lerp(canvasMaterial.emissiveIntensity, targetEmissive, step)
        glassMaterial.opacity = THREE.MathUtils.lerp(glassMaterial.opacity, targetGlassOpacity, step)
    })

    // Горячая клавиша [E] для плавного перехода камеры к экрану (только если проектор включен)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isScreenFocused) return
            if (!isNear || activeInteraction !== 'screen') return
            if (
                e.code === 'KeyE' ||
                e.key === 'e' ||
                e.key === 'E' ||
                e.key === 'у' ||
                e.key === 'У'
            ) {
                e.preventDefault()
                // Экран не должен автоматически включаться, если проектор выключен
                if (!isProjectorOn) return

                setIsScreenFocused(true)
                setActiveInteraction(null)
                playFocusSound()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNear, isScreenFocused, activeInteraction, isProjectorOn, setIsScreenFocused, setActiveInteraction])

    // Материал рамки экрана (матовый темный анодированный алюминий)
    const frameMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color('#131418'),
            roughness: 0.35,
            metalness: 0.8,
        })
    }, [])

    return (
        <group position={position} rotation={rotation} ref={groupRef}>
            {/* Тонкое полупрозрачное акриловое/стеклянное основание */}
            <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[width + 0.04, height + 0.04]} />
                <primitive object={glassMaterial} attach="material" />
            </mesh>

            {/* Верхний алюминиевый карниз/крепление экрана */}
            <mesh position={[0, height / 2 + 0.03, 0.01]}>
                <boxGeometry args={[width + 0.08, 0.04, 0.04]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>

            {/* Нижняя планка */}
            <mesh position={[0, -height / 2 - 0.02, 0.005]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, width + 0.06, 24]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>

            {/* Тонкие боковые фиксаторы экрана */}
            <mesh position={[-width / 2 - 0.015, 0, 0.005]}>
                <boxGeometry args={[0.015, height + 0.02, 0.01]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>
            <mesh position={[width / 2 + 0.015, 0, 0.005]}>
                <boxGeometry args={[0.015, height + 0.02, 0.01]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>

            {/* Полупрозрачное проекционное полотно экрана (16:9) */}
            <mesh
                position={[0, 0, 0.008]}
                onClick={(e) => {
                    e.stopPropagation()
                    if (isNear && !isScreenFocused && isProjectorOn) {
                        setIsScreenFocused(true)
                        playFocusSound()
                    }
                }}
            >
                <planeGeometry args={[width, height]} />
                <primitive object={canvasMaterial} attach="material" />
            </mesh>

            {/* Светодиод питания на верхнем корпусе */}
            <mesh position={[width / 2 + 0.02, height / 2 + 0.03, 0.025]}>
                <circleGeometry args={[0.005, 16]} />
                <meshBasicMaterial color={isProjectorOn ? '#38bdf8' : '#ef4444'} />
            </mesh>

            {/* Интерактивная всплывающая подсказка при приближении к экрану */}
            {isNear && !isScreenFocused && (
                <Html
                    position={[0, height / 2 + 0.12, 0.05]}
                    center
                    distanceFactor={2.5}
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
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {isProjectorOn ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '15px' }}>📺</span>
                                    <span
                                        style={{
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            color: '#f8fafc',
                                        }}
                                    >
                                        ЭКРАН: СМОТРЕТЬ
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
                                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            lineHeight: 1,
                                            backgroundColor: '#38bdf8d0',
                                        }}
                                    >
                                        E
                                    </span>
                                </div>
                            </>
                        ) : !selectedCaseId ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '15px' }}>📋</span>
                                <span
                                    style={{
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: '#cbd5e1',
                                    }}
                                >
                                    ВЫБЕРИТЕ ПРОЕКТ НА ДОСКЕ, А ЗАТЕМ ВКЛЮЧИТЕ ПРОЕКТОР
                                </span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '15px' }}>📽️</span>
                                <span
                                    style={{
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: '#38bdf8',
                                    }}
                                >
                                    КЕЙС #{selectedCaseId} ВЫБРАН • ВКЛЮЧИТЕ ПРОЕКТОР НА ПОЛКЕ
                                </span>
                            </div>
                        )}
                    </div>
                </Html>
            )}

            {/* Панель выхода из режима просмотра экрана */}
            {isScreenFocused && (
                <Html
                    position={[0, -height / 2 - 0.12, 0.05]}
                    center
                    distanceFactor={2.4}
                    zIndexRange={[100, 0]}
                    className="pointer-events-auto select-none"
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 18px',
                            borderRadius: '14px',
                            backgroundColor: 'rgba(11, 16, 28, 0.94)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontSize: '12px',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85)',
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>📺</span>
                        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: '#f8fafc' }}>
                            РЕЖИМ ПРОСМОТРА
                        </span>
                        <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.25)', margin: '0 2px' }} />
                        <button
                            onClick={() => setIsScreenFocused(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '5px',
                                backgroundColor: '#38bdf8d0',
                                color: '#333333ff',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: '11px',
                                fontWeight: 700,
                                transition: 'opacity 0.2s ease',
                            }}
                        >
                            <span>[ESC / E]</span>
                            <span>ВЫХОД</span>
                        </button>
                    </div>
                </Html>
            )}
        </group>
    )
}

useTexture.preload('/textures/cases/projector_idle.svg')
CASE_ITEMS.forEach((c) => useTexture.preload(c.projectorSlide))
