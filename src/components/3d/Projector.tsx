import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useGLTF, Center, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { ensureAudioContext, createSpatialAudio } from '../../utils/audioSystem'

interface ProjectorProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    interactionDistance?: number
}

// Предзагрузка и кэширование декодированного аудио проектора в памяти (0ms задержка)
let projectorAudioBuffer: AudioBuffer | null = null
let isPreloadingProjector = false

// Загрузка, декодирование и срезание начальной тишины MP3 проектора
async function preloadProjectorAudio() {
    if (projectorAudioBuffer || isPreloadingProjector) return
    isPreloadingProjector = true
    try {
        const ctx = ensureAudioContext()
        if (!ctx) return
        const res = await fetch('/audio/proektor.mp3')
        const arrayBuf = await res.arrayBuffer()
        const decoded = await ctx.decodeAudioData(arrayBuf)

        // Сканируем сэмплы и находим реальное начало звука (срезаем тишину в начале файла)
        const channelData = decoded.getChannelData(0)
        let firstSoundSample = 0
        const threshold = 0.005
        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                firstSoundSample = Math.max(0, i - 64)
                break
            }
        }

        if (firstSoundSample > 0) {
            const trimmedLength = decoded.length - firstSoundSample
            const trimmed = ctx.createBuffer(decoded.numberOfChannels, trimmedLength, decoded.sampleRate)
            for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
                const src = decoded.getChannelData(ch)
                const dst = trimmed.getChannelData(ch)
                dst.set(src.subarray(firstSoundSample))
            }
            projectorAudioBuffer = trimmed
        } else {
            projectorAudioBuffer = decoded
        }
    } catch {
        // Игнорируем
    } finally {
        isPreloadingProjector = false
    }
}

// Мгновенное воспроизведение без задержки (0 ms) строго из 3D-позиции проектора
function playProjectorSound(turningOn: boolean, panner?: PannerNode) {
    try {
        const ctx = ensureAudioContext()
        if (!ctx) return

        if (projectorAudioBuffer) {
            const source = ctx.createBufferSource()
            source.buffer = projectorAudioBuffer
            // При выключении проектора даем чуть более мягкий/низкий тон для естественности (0.92x)
            source.playbackRate.setValueAtTime(turningOn ? 1.0 : 0.92, ctx.currentTime)
            const gainNode = ctx.createGain()
            gainNode.gain.setValueAtTime(0.85, ctx.currentTime)
            source.connect(gainNode)

            if (panner) {
                gainNode.connect(panner)
            } else {
                gainNode.connect(ctx.destination)
            }

            source.start(0)
            return
        }

        preloadProjectorAudio()
        playFallbackProjectorSound(turningOn, panner)
    } catch {
        playFallbackProjectorSound(turningOn, panner)
    }
}

// Резервный синтезированный щелчок на случай проблем с сетью
function playFallbackProjectorSound(turningOn: boolean, panner?: PannerNode) {
    try {
        const ctx = ensureAudioContext()
        if (!ctx) return

        if (turningOn) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(220, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18)
            gain.gain.setValueAtTime(0.25, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
            osc.connect(gain)
            if (panner) {
                gain.connect(panner)
            } else {
                gain.connect(ctx.destination)
            }
            osc.start()
            osc.stop(ctx.currentTime + 0.25)
        } else {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(580, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.15)
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
            osc.connect(gain)
            if (panner) {
                gain.connect(panner)
            } else {
                gain.connect(ctx.destination)
            }
            osc.start()
            osc.stop(ctx.currentTime + 0.2)
        }
    } catch {
        // Игнорируем в средах без аудио
    }
}

export function Projector({
    position = [-2.2, 1.78, 1.85],
    rotation = [0, 0, 0],
    targetHeight = 0.15,
    interactionDistance = 2.2,
}: ProjectorProps) {
    const gltf = useGLTF('/models/EVPSVPL.glb')
    const groupRef = useRef<THREE.Group>(null)
    const projectorWorldPos = useRef(new THREE.Vector3())
    const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null)
    const { camera } = useThree()

    const selectedCaseId = useOfficeStore((state) => state.selectedCaseId)
    const isProjectorOn = useOfficeStore((state) => state.isProjectorOn)
    const toggleProjector = useOfficeStore((state) => state.toggleProjector)
    const activeInteraction = useOfficeStore((state) => state.activeInteraction)
    const setActiveInteraction = useOfficeStore((state) => state.setActiveInteraction)

    const [isNear, setIsNear] = useState(false)
    const camDir = useRef(new THREE.Vector3())
    const toProjector = useRef(new THREE.Vector3())

    // Инициализация 3D пространственного звука проектора
    useEffect(() => {
        const posAudio = createSpatialAudio({
            refDistance: 2.2,
            maxDistance: 22.0,
            rolloffFactor: 1.2,
            distanceModel: 'inverse',
        })
        positionalAudioRef.current = posAudio

        const group = groupRef.current
        if (group) {
            group.add(posAudio)
        }

        return () => {
            if (group) {
                group.remove(posAudio)
            }
        }
    }, [])

    // Обработчик переключения с 3D-звуком
    const handleToggle = useCallback(() => {
        const nextState = !isProjectorOn
        toggleProjector()
        playProjectorSound(nextState, positionalAudioRef.current?.panner)
    }, [isProjectorOn, toggleProjector])

    // PBR-материалы корпуса Sony и стеклянной линзы
    const { bodyMaterial, lensMaterial, lensGlowMaterial } = useMemo(() => {
        const bodyMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#16181d'),
            roughness: 0.35,
            metalness: 0.25,
            side: THREE.DoubleSide,
        })

        const lensMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#1e293b'),
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.9,
            ior: 1.52,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            side: THREE.DoubleSide,
        })

        const glowMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#38bdf8'),
            transparent: true,
            opacity: isProjectorOn ? 0.95 : 0.0,
        })

        return { bodyMaterial: bodyMat, lensMaterial: lensMat, lensGlowMaterial: glowMat }
    }, [isProjectorOn])

    // Подготовка клонированной сцены
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false

                if (mesh.name && mesh.name.includes('Mesh_1_')) {
                    // Линза объектива проектора
                    mesh.material = isProjectorOn ? lensGlowMaterial : lensMaterial
                } else {
                    mesh.material = bodyMaterial
                }
            }
        })
        return scene
    }, [gltf.scene, bodyMaterial, lensMaterial, lensGlowMaterial, isProjectorOn])

    // Вычисление масштаба под targetHeight
    const computedScale: [number, number, number] = useMemo(() => {
        const box = new THREE.Box3().setFromObject(clonedScene)
        const size = new THREE.Vector3()
        box.getSize(size)
        const currentHeight = size.y || 1
        const factor = targetHeight / currentHeight
        return [factor, factor, factor]
    }, [clonedScene, targetHeight])

    useFrame(() => {
        if (!groupRef.current) return

        // 1. Проверка дистанции: подойти близко к полке (<= 1.35м)
        groupRef.current.updateMatrixWorld()
        if (positionalAudioRef.current) {
            positionalAudioRef.current.updateMatrixWorld()
        }
        groupRef.current.getWorldPosition(projectorWorldPos.current)
        const distance = camera.position.distanceTo(projectorWorldPos.current)

        // 2. Проверка направления взгляда: камера должна смотреть прямо на проектор
        camera.getWorldDirection(camDir.current)
        toProjector.current.subVectors(projectorWorldPos.current, camera.position).normalize()
        const dot = camDir.current.dot(toProjector.current)

        const isTargeted = distance <= interactionDistance && dot >= 0.86

        if (isTargeted) {
            if (activeInteraction === null || activeInteraction === 'projector') {
                if (activeInteraction !== 'projector') setActiveInteraction('projector')
                if (!isNear) setIsNear(true)
            }
        } else {
            if (activeInteraction === 'projector') {
                setActiveInteraction(null)
            }
            if (isNear) setIsNear(false)
        }
    })

    // Предзагрузка звука проектора
    useEffect(() => {
        preloadProjectorAudio()
        const initOnGesture = () => {
            ensureAudioContext()
            preloadProjectorAudio()
        }
        window.addEventListener('click', initOnGesture, { once: true })
        window.addEventListener('keydown', initOnGesture, { once: true })
        return () => {
            window.removeEventListener('click', initOnGesture)
            window.removeEventListener('keydown', initOnGesture)
        }
    }, [])

    // Горячая клавиша [E]
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isNear || activeInteraction !== 'projector') return
            if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
                e.preventDefault()
                handleToggle()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNear, activeInteraction, handleToggle])

    return (
        <group position={position} rotation={rotation} ref={groupRef}>
            {/* Корпус проектора, стоящего на полке */}
            <group
                onClick={(e) => {
                    e.stopPropagation()
                    if (isNear) handleToggle()
                }}
            >
                <group scale={computedScale}>
                    <Center top>
                        <primitive object={clonedScene} />
                    </Center>
                </group>
            </group>

            {/* Интерактивная всплывающая подсказка при приближении к проектору */}
            {isNear && (
                <Html
                    position={[0, 0.28, 0]}
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
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px' }}>📽️</span>
                            <span
                                style={{
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: '#f8fafc',
                                }}
                            >
                                {isProjectorOn
                                    ? 'ПРОЕКТОР: ВЫКЛЮЧИТЬ'
                                    : selectedCaseId
                                    ? `ТРАНСЛЯЦИЯ (КЕЙС #${selectedCaseId})`
                                    : 'ПРОЕКТОР: ВКЛЮЧИТЬ'}
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
                    </div>
                </Html>
            )}
        </group>
    )
}

useGLTF.preload('/models/EVPSVPL.glb')
