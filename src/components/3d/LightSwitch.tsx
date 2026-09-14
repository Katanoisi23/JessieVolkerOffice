import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useGLTF, useTexture, Center, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { ensureAudioContext, createSpatialAudio } from '../../utils/audioSystem'

interface LightSwitchProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    interactionDistance?: number
}

// Предзагрузка и кэширование декодированного аудио в памяти через Web Audio API (0ms задержка)
let switchAudioBuffer: AudioBuffer | null = null
let isPreloading = false

// Загрузка, декодирование и мгновенное срезание предваряющей тишины MP3
async function preloadSwitchAudio() {
    if (switchAudioBuffer || isPreloading) return
    isPreloading = true
    try {
        const ctx = ensureAudioContext()
        if (!ctx) return
        const res = await fetch('/audio/svet.mp3')
        const arrayBuf = await res.arrayBuffer()
        const decoded = await ctx.decodeAudioData(arrayBuf)

        // Сканируем сэмплы и находим реальное начало звука щелчка (убираем паузу/тишину в начале файла)
        const channelData = decoded.getChannelData(0)
        let firstSoundSample = 0
        const threshold = 0.005
        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                // Берем срез чуть раньше первого пика для сохранения атаки звука
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
            switchAudioBuffer = trimmed
        } else {
            switchAudioBuffer = decoded
        }
    } catch {
        // Игнорируем ошибки предзагрузки
    } finally {
        isPreloading = false
    }
}

// Мгновенное воспроизведение без задержки (0 ms) строго из 3D-позиции выключателя на стене
function playSwitchSound(panner?: PannerNode) {
    try {
        const ctx = ensureAudioContext()
        if (!ctx) return

        if (switchAudioBuffer) {
            const source = ctx.createBufferSource()
            source.buffer = switchAudioBuffer
            const gainNode = ctx.createGain()
            gainNode.gain.setValueAtTime(0.9, ctx.currentTime)
            source.connect(gainNode)
            if (panner) {
                gainNode.connect(panner)
            } else {
                gainNode.connect(ctx.destination)
            }
            source.start(0)
            return
        }

        // Если буфер еще загружается, запускаем резервный щелчок
        preloadSwitchAudio()
        playFallbackSwitchSound(panner)
    } catch {
        playFallbackSwitchSound(panner)
    }
}

// Резервный синтезированный щелчок через Web Audio API на случай проблем с сетью
function playFallbackSwitchSound(panner?: PannerNode) {
    try {
        const ctx = ensureAudioContext()
        if (!ctx) return

        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(900, ctx.currentTime)
        osc1.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.02)
        gain1.gain.setValueAtTime(0.2, ctx.currentTime)
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
        osc1.connect(gain1)
        if (panner) {
            gain1.connect(panner)
        } else {
            gain1.connect(ctx.destination)
        }
        osc1.start()
        osc1.stop(ctx.currentTime + 0.025)
    } catch {
        // Игнорируем в средах без поддержки аудио
    }
}

export function LightSwitch({
    position = [0.75, 1, 3.35],
    rotation = [-1.5, 0, 0],
    targetHeight = 0.02,
    scale = 1,
    interactionDistance = 1.15,
}: LightSwitchProps) {
    const gltf = useGLTF('/models/lightSwitch.glb')
    const groupRef = useRef<THREE.Group>(null)
    const buttonMeshRef = useRef<THREE.Mesh | null>(null)
    const switchWorldPos = useRef(new THREE.Vector3())
    const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null)
    const [isNear, setIsNear] = useState(false)

    const camDir = useRef(new THREE.Vector3())
    const toSwitch = useRef(new THREE.Vector3())

    // Инициализация 3D пространственного звука выключателя
    useEffect(() => {
        const posAudio = createSpatialAudio({
            refDistance: 1.5,
            maxDistance: 18.0,
            rolloffFactor: 1.3,
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

    // Глобальное состояние света в офисе
    const isRoomLightOn = useOfficeStore((state) => state.isRoomLightOn)
    const toggleRoomLight = useOfficeStore((state) => state.toggleRoomLight)
    const activeInteraction = useOfficeStore((state) => state.activeInteraction)
    const setActiveInteraction = useOfficeStore((state) => state.setActiveInteraction)

    // Обработчик переключения с пространственным аудиоэффектом
    const handleToggle = useCallback(() => {
        toggleRoomLight()
        playSwitchSound(positionalAudioRef.current?.panner)
    }, [toggleRoomLight])

    // Загрузка PBR-текстур рамки и клавиши
    const textures = useTexture({
        diffuseBtn: '/textures/Light/DiffuseButtonSwitch.png',
        diffuseFrame: '/textures/Light/DiffuseSwitch.png',
        metalBtn: '/textures/Light/MetalicButtonSwitch.png',
        metalFrame: '/textures/Light/MetalicSwitch.png',
        roughBtn: '/textures/Light/RoughnessButtonSwitch.png',
        roughFrame: '/textures/Light/RoughnessSwicht.png', // с опечаткой Swicht как в исходном файле
    })

    // Настройка материалов
    const { buttonMaterial, frameMaterial } = useMemo(() => {
        textures.diffuseBtn.colorSpace = THREE.SRGBColorSpace
        textures.diffuseFrame.colorSpace = THREE.SRGBColorSpace

        textures.diffuseBtn.flipY = false
        textures.diffuseFrame.flipY = false
        textures.metalBtn.flipY = false
        textures.metalFrame.flipY = false
        textures.roughBtn.flipY = false
        textures.roughFrame.flipY = false

        // Материал клавиши
        const btnMat = new THREE.MeshStandardMaterial({
            map: textures.diffuseBtn,
            metalnessMap: textures.metalBtn,
            roughnessMap: textures.roughBtn,
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide,
        })

        // Материал внешней рамки
        const frameMat = new THREE.MeshStandardMaterial({
            map: textures.diffuseFrame,
            metalnessMap: textures.metalFrame,
            roughnessMap: textures.roughFrame,
            roughness: 0.25,
            metalness: 0.05,
            side: THREE.DoubleSide,
        })

        return { buttonMaterial: btnMat, frameMaterial: frameMat }
    }, [textures])

    // Применяем материалы к рамке и кнопке до первого рендера
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        const meshes: THREE.Mesh[] = []

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()
                meshes.push(mesh)
            }
        })

        // Если 2 меша: меньший — клавиша, больший — рамка
        let btnMesh: THREE.Mesh | null = null
        if (meshes.length === 2) {
            const [meshA, meshB] = meshes
            const sizeA = new THREE.Box3().setFromObject(meshA).getSize(new THREE.Vector3()).length()
            const sizeB = new THREE.Box3().setFromObject(meshB).getSize(new THREE.Vector3()).length()
            btnMesh = sizeA < sizeB ? meshA : meshB
        }

        meshes.forEach((mesh) => {
            const name = (mesh.name || '').toLowerCase()
            const isButton =
                mesh === btnMesh ||
                /button|клавиш|кнопк/i.test(name) ||
                /button/i.test(mesh.parent?.name || '')

            mesh.material = isButton ? buttonMaterial : frameMaterial

            if (isButton) {
                buttonMeshRef.current = mesh
            }
        })

        return scene
    }, [gltf.scene, buttonMaterial, frameMaterial])

    // Масштабирование
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

    // Отслеживание дистанции игрока и взгляда на выключатель
    useFrame(({ camera }) => {
        if (!groupRef.current) return

        // 1. Проверка дистанции: подойти очень близко (<= 1.15м)
        groupRef.current.updateMatrixWorld()
        if (positionalAudioRef.current) {
            positionalAudioRef.current.updateMatrixWorld()
        }
        groupRef.current.getWorldPosition(switchWorldPos.current)
        const distance = camera.position.distanceTo(switchWorldPos.current)

        // 2. Проверка направления взгляда игрока (камера должна смотреть прямо на выключатель)
        camera.getWorldDirection(camDir.current)
        toSwitch.current.subVectors(switchWorldPos.current, camera.position).normalize()
        const dot = camDir.current.dot(toSwitch.current)

        const isTargeted = distance <= interactionDistance && dot >= 0.88

        if (isTargeted) {
            if (activeInteraction === null || activeInteraction === 'light_switch') {
                if (activeInteraction !== 'light_switch') setActiveInteraction('light_switch')
                if (!isNear) setIsNear(true)
            }
        } else {
            if (activeInteraction === 'light_switch') {
                setActiveInteraction(null)
            }
            if (isNear) setIsNear(false)
        }

        // 3. Механический наклон клавиши выключателя
        if (buttonMeshRef.current) {
            const targetRotationX = isRoomLightOn ? 0.08 : -0.08
            buttonMeshRef.current.rotation.x = THREE.MathUtils.lerp(
                buttonMeshRef.current.rotation.x,
                targetRotationX,
                0.25
            )
        }
    })

    // Предзагрузка звука щелчка сразу при загрузке страницы
    useEffect(() => {
        preloadSwitchAudio()
        const initOnGesture = () => {
            ensureAudioContext()
            preloadSwitchAudio()
        }
        window.addEventListener('click', initOnGesture, { once: true })
        window.addEventListener('keydown', initOnGesture, { once: true })
        return () => {
            window.removeEventListener('click', initOnGesture)
            window.removeEventListener('keydown', initOnGesture)
        }
    }, [])

    // Горячая клавиша [E] при приближении и прямом взгляде на выключатель
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isNear || activeInteraction !== 'light_switch') return
            // Обработка и английской 'E', и русской 'У'
            if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
                e.preventDefault()
                handleToggle()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNear, activeInteraction, handleToggle])

    return (
        <group
            position={position}
            rotation={rotation}
            scale={computedScale}
            ref={groupRef}
            onClick={(e) => {
                e.stopPropagation()
                if (isNear) handleToggle()
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

            {/* Всплывающая подсказка в стиле референса (фото 2), выполненная в синем цвете */}
            {isNear && (
                <Html
                    position={[0, 0.04, 0.16]}
                    center
                    distanceFactor={2.6}
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
                        {/* Иконка лампочки в неоново-синем стиле */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    color: isRoomLightOn ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)',
                                    filter: isRoomLightOn
                                        ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.95))'
                                        : 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.4))',
                                    transition: 'all 0.3s ease',
                                    flexShrink: 0,
                                }}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                                <path d="M9 18h6" />
                                <path d="M10 22h4" />
                            </svg>
                            <span
                                style={{
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: '#f8fafc',
                                }}
                            >
                                {isRoomLightOn ? 'СВЕТ' : 'СВЕТ (ВЫКЛ)'}
                            </span>
                        </div>

                        {/* Разделитель */}
                        <div
                            style={{
                                width: '1px',
                                height: '14px',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                margin: '0 2px',
                            }}
                        />

                        {/* Текст press и синяя неоновая клавиша E */}
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