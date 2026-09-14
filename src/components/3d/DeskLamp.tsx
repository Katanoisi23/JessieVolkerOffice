import { useState, useMemo, useEffect } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'

interface DeskLampProps {
    modelPath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    lightColor?: string
    lightIntensity?: number
    controlledByRoomLight?: boolean
    castShadow?: boolean
}

export function DeskLamp({
    modelPath = '/models/lamp.glb',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    targetHeight = 0.45,
    lightColor = '#ffe2b8', // Теплый мягкий свет лампы
    lightIntensity = 3.5,
    controlledByRoomLight = true,
    castShadow = false,
}: DeskLampProps) {
    const isRoomLightOn = useOfficeStore((state) => state.isRoomLightOn)
    const [localIsOn, setLocalIsOn] = useState(true)

    // Приоритет общего выключателя света комнаты
    const active = controlledByRoomLight ? isRoomLightOn : localIsOn

    const { scene } = useGLTF(modelPath)
    const clonedScene = useMemo(() => scene.clone(true), [scene])

    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = castShadow
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals()
                }
            }
        })
    }, [clonedScene, castShadow])

    const computedScale = useMemo(() => {
        const box = new THREE.Box3().setFromObject(clonedScene)
        const size = new THREE.Vector3()
        box.getSize(size)
        const factor = targetHeight / (size.y || 1)
        return [factor, factor, factor] as [number, number, number]
    }, [clonedScene, targetHeight])

    return (
        <group
            position={position}
            rotation={rotation}
            onClick={(e) => {
                e.stopPropagation()
                if (!controlledByRoomLight) {
                    setLocalIsOn(!localIsOn)
                }
            }}
        >
            <group scale={computedScale}>
                <Center top>
                    <primitive object={clonedScene} />
                </Center>
            </group>

            {/* Источник света от лампы (горит только при включенном свете) */}
            {active ? (
                <group position={[0, targetHeight * 0.55, 0.08]}>
                    <pointLight
                        color={lightColor}
                        intensity={lightIntensity}
                        distance={3.5}
                        decay={2}
                    />
                    {/* Светящаяся колба лампочки */}
                    <mesh>
                        <sphereGeometry args={[0.02, 26, 16]} />
                        <meshBasicMaterial color={lightColor} />
                    </mesh>
                </group>
            ) : (
                <group position={[0, targetHeight * 0.55, 0.08]}>
                    {/* Выключенная матовая колба без свечения и пересвета Bloom */}
                    <mesh>
                        <sphereGeometry args={[0.018, 16, 16]} />
                        <meshStandardMaterial color="#2d2d30" roughness={0.9} />
                    </mesh>
                </group>
            )}
        </group>
    )
}