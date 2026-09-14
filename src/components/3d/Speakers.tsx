import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

interface SpeakerProps {
    modelPath: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function Speaker({
    modelPath,
    position = [-2.2, 1, -1.4],
    rotation = [0, 0, 0],
    targetHeight = 0.35,
    scale = 1,
}: SpeakerProps) {
    const gltf = useGLTF(modelPath)
    const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
    const groupRef = useRef<THREE.Group>(null)

    // Выводим в консоль оригинальные материалы модели
    useEffect(() => {
        console.log(`=== МАТЕРИАЛЫ КОЛОНКИ (${modelPath}) ===`)
        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
                console.log(`🔊 Меш: "${mesh.name}" | Материал: "${mat?.name}" | Текстура внутри: ${!!(mat as any)?.map}`)
            }
        })
        console.log('==========================================')
    }, [gltf.scene, modelPath])

    const defaultScale: [number, number, number] = [0.1, 0.1, 0.1]

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

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                {/* Отображаем родную модель без принудительной перекраски */}
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}