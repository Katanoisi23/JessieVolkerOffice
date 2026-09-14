import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface ElectricKettleProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function ElectricKettle({
    position = [1.8, 0.77, -4],
    rotation = [0, 1.6, 0],
    targetHeight = 0.35,
    scale = 1,
}: ElectricKettleProps) {
    const gltf = useGLTF('/models/ElectricKettle.glb')
    const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка всех карт PBR
    const textures = useTexture({
        map: '/textures/kettle/DefaultMaterial_BaseColor.png',
        normalMap: '/textures/kettle/DefaultMaterial_Normal.png',
        roughnessMap: '/textures/kettle/DefaultMaterial_Roughness.png',
        metalnessMap: '/textures/kettle/DefaultMaterial_Metallic.png',
        alphaMap: '/textures/kettle/DefaultMaterial_Opacity.png',
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
            roughnessMap: textures.roughnessMap,
            metalnessMap: textures.metalnessMap,
            side: THREE.DoubleSide,
            // 👈 Убрали alphaMap и transparent: true, чтобы крышка и корпус были плотными
        })
    }, [textures])

    // Применение материала ко всем мешам чайника
    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry && !mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
                mesh.material = material
            }
        })
    }, [clonedScene, material])

    // Масштабирование под желаемую высоту
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
        return [1, 1, 1]
    }, [clonedScene, targetHeight, scale])

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}