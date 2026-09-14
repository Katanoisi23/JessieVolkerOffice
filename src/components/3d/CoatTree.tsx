import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface CoatTreeProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    color?: string
    metalness?: number
    roughness?: number
}

export function CoatTree({
    position = [1.6, 0, 2.3],
    rotation = [0, 0, 0],
    targetHeight = 2,
    scale = 1,
    color = '#1f1f23', // Стильный графитовый металл стойки
    metalness = 0.7,   // Металлический отблеск
    roughness = 0.35,  // Полуматовое покрытие
}: CoatTreeProps) {
    const gltf = useGLTF('/models/coatTree.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка карты микроцарапин
    const normalMap = useTexture('/textures/coatTree/scratchmap-normalmap.png')

    // Настройка материала металла с микроцарапинами
    const material = useMemo(() => {
        normalMap.flipY = false

        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            normalMap,
            normalScale: new THREE.Vector2(1.2, 1.2), // Чёткость проявления царапин
            roughness,
            metalness,
            side: THREE.DoubleSide,
        })
    }, [normalMap, color, roughness, metalness])

    // Применяем материал ко всем частям вешалки до первого кадра
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()
                mesh.material = material
            }
        })
        return scene
    }, [gltf.scene, material])

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

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}