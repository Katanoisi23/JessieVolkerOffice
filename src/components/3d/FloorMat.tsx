import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface FloorMatProps {
    modelPath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function FloorMat({
    modelPath = '/models/floorMat.glb',
    position = [-0.12, 0, 2.9],
    rotation = [0, 0, 0],
    targetHeight = 0.04,
    scale = 1,
}: FloorMatProps) {
    const gltf = useGLTF(modelPath)
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка PBR-текстур коврика
    const textures = useTexture({
        map: '/textures/floorMat/floor_mat_BaseColor.png',
        normalMap: '/textures/floorMat/floor_mat_Normal.png',
        roughnessMap: '/textures/floorMat/floor_mat_Roughness.png',
        metalnessMap: '/textures/floorMat/floor_mat_Metallic.png',
    })

    // Настройка PBR-материала
    const material = useMemo(() => {
        textures.map.colorSpace = THREE.SRGBColorSpace
        textures.map.flipY = false
        textures.normalMap.flipY = false
        textures.roughnessMap.flipY = false
        textures.metalnessMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map: textures.map,
            normalMap: textures.normalMap,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughnessMap: textures.roughnessMap,
            metalnessMap: textures.metalnessMap,
            side: THREE.DoubleSide,
        })
    }, [textures])

    // Применяем материал до первого рендера
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