import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useGLTF, useTexture, Center, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { CASE_ITEMS } from '../../data/cases'

interface WhiteBoardProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    interactionDistance?: number
}

// Звуковой эффект магнитного щелчка при фиксации магнита к металлической доске
function playMagnetSound() {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()

        // 1. Металлический звонкий соударительный импульс
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(1400, ctx.currentTime)
        osc1.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035)
        gain1.gain.setValueAtTime(0.35, ctx.currentTime)
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start()
        osc1.stop(ctx.currentTime + 0.04)

        // 2. Глухой щелчок прижима неодимового магнита к стали
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(450, ctx.currentTime + 0.01)
        osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.06)
        gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.01)
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(ctx.currentTime + 0.01)
        osc2.stop(ctx.currentTime + 0.07)
    } catch {
        // Игнорируем в средах без аудио
    }
}

// Компонент 3D-магнитика из модели Magnet.glb с полным набором PBR-текстур
function MagnetIndicator({ position }: { position: [number, number, number] }) {
    const gltf = useGLTF('/models/Magnet.glb')

    // PBR-текстуры магнита
    const textures = useTexture({
        map: '/textures/Magnet/Magnet_BaseColor.png',
        normalMap: '/textures/Magnet/Magnet_Normal.png',
        roughnessMap: '/textures/Magnet/Magnet_Roughness.png',
        metalnessMap: '/textures/Magnet/Magnet_Metallic.png',
        aoMap: '/textures/Magnet/Magnet_AO.png',
    })

    const material = useMemo(() => {
        textures.map.colorSpace = THREE.SRGBColorSpace
        textures.map.flipY = false
        textures.normalMap.flipY = false
        textures.roughnessMap.flipY = false
        textures.metalnessMap.flipY = false
        textures.aoMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map: textures.map,
            normalMap: textures.normalMap,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughnessMap: textures.roughnessMap,
            metalnessMap: textures.metalnessMap,
            aoMap: textures.aoMap,
            aoMapIntensity: 1.0,
            side: THREE.DoubleSide,
        })
    }, [textures])

    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals()
                    if (!mesh.geometry.attributes.uv2 && mesh.geometry.attributes.uv) {
                        mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv)
                    }
                }
                mesh.material = material
            }
        })
        return scene
    }, [gltf.scene, material])

    return (
        <group position={position}>
            {/* Мягкая тень под магнитом */}
            <mesh position={[0, 0, -0.003]}>
                <circleGeometry args={[0.022, 32]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.35} />
            </mesh>

            {/* 3D-модель магнита, ориентированная лицевой стороной к зрителю (+Z) */}
            <group rotation={[-Math.PI / 2, 0, 0]} scale={[1.8, 1.8, 1.8]}>
                <primitive object={clonedScene} />
            </group>
        </group>
    )
}

// Металлические булавки по 4 углам листа
function CornerPins({ width, height }: { width: number; height: number }) {
    const hw = width / 2 - 0.018
    const hh = height / 2 - 0.018
    const corners = [
        [-hw, hh],
        [hw, hh],
        [-hw, -hh],
        [hw, -hh],
    ]

    return (
        <group>
            {corners.map(([x, y], idx) => (
                <group key={idx} position={[x, y, 0.003]}>
                    {/* Тень булавки */}
                    <mesh position={[0.001, -0.001, -0.001]}>
                        <circleGeometry args={[0.006, 16]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
                    </mesh>
                    {/* Шляпка булавки */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <sphereGeometry args={[0.005, 16, 16]} />
                        <meshStandardMaterial color="#e5e5e5" metalness={0.85} roughness={0.2} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

export function WhiteBoard({
    position = [1.85, 0, 1.35],
    rotation = [0, Math.PI / 2, 0],
    targetHeight = 1.75,
    scale = 1,
    interactionDistance = 1.85,
}: WhiteBoardProps) {
    const gltf = useGLTF('/models/whiteBoard.glb')
    const groupRef = useRef<THREE.Group>(null)
    const cardMeshesRef = useRef<(THREE.Mesh | null)[]>([])
    const { camera } = useThree()

    const selectedCaseId = useOfficeStore((state) => state.selectedCaseId)
    const setSelectedCase = useOfficeStore((state) => state.setSelectedCase)
    const activeInteraction = useOfficeStore((state) => state.activeInteraction)
    const setActiveInteraction = useOfficeStore((state) => state.setActiveInteraction)

    const [hoveredCaseId, setHoveredCaseId] = useState<number | null>(null)
    const [isNearBoard, setIsNearBoard] = useState(false)

    // Загрузка полного комплекта PBR-текстур доски
    const boardTextures = useTexture({
        map: '/textures/whiteBoard/whiteBoard_58_BaseColor.png',
        normalMap: '/textures/whiteBoard/whiteBoard_58_Normal.png',
        roughnessMap: '/textures/whiteBoard/whiteBoard_58_Roughness.png',
        metalnessMap: '/textures/whiteBoard/whiteBoard_58_Metallic.png',
    })

    // Загрузка текстур 6 кейсов
    const caseTextures = useTexture(CASE_ITEMS.map((c) => c.texture))

    // Настройка PBR-материала самой доски
    const boardMaterial = useMemo(() => {
        boardTextures.map.colorSpace = THREE.SRGBColorSpace
        boardTextures.map.flipY = false
        boardTextures.normalMap.flipY = false
        boardTextures.roughnessMap.flipY = false
        boardTextures.metalnessMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map: boardTextures.map,
            normalMap: boardTextures.normalMap,
            roughnessMap: boardTextures.roughnessMap,
            metalnessMap: boardTextures.metalnessMap,
            side: THREE.DoubleSide,
        })
    }, [boardTextures])

    // Применяем материал доски
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry && !mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
                mesh.material = boardMaterial
            }
        })
        return scene
    }, [gltf.scene, boardMaterial])

    // Материалы для карточек кейсов
    const cardMaterials = useMemo(() => {
        return caseTextures.map((tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.flipY = true
            tex.minFilter = THREE.LinearMipmapLinearFilter
            tex.magFilter = THREE.LinearFilter
            tex.generateMipmaps = true

            return new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.65,
                metalness: 0.0,
                side: THREE.DoubleSide,
            })
        })
    }, [caseTextures])

    // Масштабирование
    const defaultScale: [number, number, number] = [1, 1, 1]

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

    const handleSelectCase = useCallback(
        (id: number) => {
            setSelectedCase(id)
            playMagnetSound()
        },
        [setSelectedCase]
    )

    // Рейкастинг из центра экрана (прицела) при приближении к доске
    const raycaster = useMemo(() => new THREE.Raycaster(), [])
    const centerPoint = useMemo(() => new THREE.Vector2(0, 0), [])
    const boardWorldPos = useRef(new THREE.Vector3())

    useFrame(() => {
        if (!groupRef.current) return

        groupRef.current.getWorldPosition(boardWorldPos.current)
        const boardCenterY = boardWorldPos.current.y + 1.45 * (computedScale[1] || 1)
        const dx = camera.position.x - boardWorldPos.current.x
        const dy = camera.position.y - boardCenterY
        const dz = camera.position.z - boardWorldPos.current.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const near = distance <= interactionDistance

        if (near !== isNearBoard) {
            setIsNearBoard(near)
        }

        if (!near) {
            if (hoveredCaseId !== null) setHoveredCaseId(null)
            if (activeInteraction === 'whiteboard') setActiveInteraction(null)
            return
        }

        // Рейкаст из центра взгляда игрока
        raycaster.setFromCamera(centerPoint, camera)
        const meshes = cardMeshesRef.current.filter(Boolean) as THREE.Mesh[]
        const intersects = raycaster.intersectObjects(meshes, false)

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object as THREE.Mesh
            const caseId = (hitMesh.userData as { caseId?: number })?.caseId
            if (caseId && caseId !== hoveredCaseId) {
                setHoveredCaseId(caseId)
            }
            if (activeInteraction === null || activeInteraction === 'whiteboard') {
                if (activeInteraction !== 'whiteboard') setActiveInteraction('whiteboard')
            }
        } else {
            if (hoveredCaseId !== null) {
                setHoveredCaseId(null)
            }
            if (activeInteraction === 'whiteboard') {
                setActiveInteraction(null)
            }
        }
    })

    // Горячая клавиша E
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isNearBoard || hoveredCaseId === null || activeInteraction !== 'whiteboard') return
            if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
                e.preventDefault()
                handleSelectCase(hoveredCaseId)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNearBoard, hoveredCaseId, activeInteraction, handleSelectCase])

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>

            {/* Плоскость с файлами кейсов на лицевой стороне доски (обращена к игроку) */}
            <group position={[0, 0, -0.018]} rotation={[0, Math.PI, 0]}>
                {CASE_ITEMS.map((item, index) => {
                    const isSelected = selectedCaseId === item.id
                    const isHovered = hoveredCaseId === item.id

                    return (
                        <group
                            key={item.id}
                            position={[item.x, item.y, 0]}
                            rotation={[0, 0, -item.rotationZ]}
                        >
                            {/* Тень под листом бумаги */}
                            <mesh position={[0.003, -0.004, -0.002]}>
                                <planeGeometry args={[item.width, item.height]} />
                                <meshBasicMaterial color="#000000" transparent opacity={0.35} />
                            </mesh>

                            {/* Лист с обложкой кейса */}
                            <mesh
                                ref={(el) => {
                                    cardMeshesRef.current[index] = el
                                }}
                                userData={{ caseId: item.id }}
                                material={cardMaterials[index]}
                                castShadow
                                receiveShadow
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (isNearBoard) handleSelectCase(item.id)
                                }}
                                onPointerOver={() => {
                                    if (isNearBoard) setHoveredCaseId(item.id)
                                }}
                                onPointerOut={() => {
                                    if (isNearBoard && hoveredCaseId === item.id) setHoveredCaseId(null)
                                }}
                            >
                                <planeGeometry args={[item.width, item.height]} />
                            </mesh>

                            {/* Булавки по углам */}
                            <CornerPins width={item.width} height={item.height} />

                            {/* 3D-Магнитик, появляющийся при выборе работы */}
                            {isSelected && (
                                <MagnetIndicator
                                    position={[0, item.height / 2 - 0.024, 0.005]}
                                />
                            )}

                            {/* Тонкая подсветка контура при наведении */}
                            {isHovered && !isSelected && (
                                <mesh position={[0, 0, 0.002]}>
                                    <planeGeometry args={[item.width + 0.01, item.height + 0.01]} />
                                    <meshBasicMaterial color="#38bdf8" wireframe />
                                </mesh>
                            )}

                            {/* Всплывающая подсказка в точности по референсу пользователя: 🏆 AWARDS | press E */}
                            {isHovered && isNearBoard && (
                                <Html
                                    position={[0, 0, 0.05]}
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '15px' }}>🏆</span>
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: '12px',
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    color: '#f8fafc',
                                                }}
                                            >
                                                {item.title}
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
                })}
            </group>
        </group>
    )
}

useGLTF.preload('/models/whiteBoard.glb')
useGLTF.preload('/models/Magnet.glb')
useTexture.preload('/textures/whiteBoard/whiteBoard_58_BaseColor.png')
useTexture.preload('/textures/Magnet/Magnet_BaseColor.png')
useTexture.preload('/textures/Magnet/Magnet_Normal.png')
useTexture.preload('/textures/Magnet/Magnet_Roughness.png')
useTexture.preload('/textures/Magnet/Magnet_Metallic.png')
useTexture.preload('/textures/Magnet/Magnet_AO.png')
CASE_ITEMS.forEach((c) => useTexture.preload(c.texture))