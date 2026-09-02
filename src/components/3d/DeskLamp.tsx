import { useState, useMemo, useEffect } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

interface DeskLampProps {
    modelPath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    lightColor?: string
    lightIntensity?: number
}

export function DeskLamp({
    modelPath = '/models/lamp.glb',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    targetHeight = 0.45,
    lightColor = '#817e47ff', // Теплый оттенок света
    lightIntensity = 3.5,
}: DeskLampProps) {
    const [isOn, setIsOn] = useState(true)
    const { scene } = useGLTF(modelPath)
    const clonedScene = useMemo(() => scene.clone(true), [scene])

    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals()
                }
            }
        })
    }, [clonedScene])

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
                setIsOn(!isOn) // Включение/выключение по клику
            }}
        >
            <group scale={computedScale}>
                <Center top>
                    <primitive object={clonedScene} />
                </Center>
            </group>

            {/* Источник света от лампы */}
            {isOn && (
                <group position={[0, targetHeight * 0.55, 0.08]}>
                    <pointLight
                        color={lightColor}
                        intensity={lightIntensity}
                        distance={3.5}
                        decay={2}
                        castShadow
                        shadow-bias={-0.0001}
                        shadow-mapSize={[1024, 1024]}
                    />
                    {/* Светящаяся колба лампочки */}
                    <mesh>
                        <sphereGeometry args={[0.02, 26, 16]} />
                        <meshBasicMaterial color={lightColor} />
                    </mesh>
                </group>
            )}
        </group>
    )
}