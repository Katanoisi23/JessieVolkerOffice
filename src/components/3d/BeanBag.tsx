import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface BeanBagProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function BeanBag({
    position = [-1.5, 0, 2.6],
    rotation = [0, 2, 0],
    targetHeight = 1.15,
    scale = 1,
}: BeanBagProps) {
    const gltf = useGLTF('/models/BeanBag.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка полного комплекта PBR-текстур
    const textures = useTexture({
        map: '/textures/chair/chair_basecolor.png',
        normalMap: '/textures/chair/chair_normal.png',
        roughnessMap: '/textures/chair/chair_roughness.png',
        metalnessMap: '/textures/chair/chair_metalness.png',
        aoMap: '/textures/chair/chair_ao.png',
    })

    // Настройка PBR-материала обивки кресла
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
            roughnessMap: textures.roughnessMap,
            metalnessMap: textures.metalnessMap,
            aoMap: textures.aoMap,
            aoMapIntensity: 1.2, // Подчеркивает объем складок
            side: THREE.DoubleSide,
        })
    }, [textures])

    // Применяем материал ко всем деталям модели до первого кадра
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry && !mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
                mesh.material = material
            }
        })
        return scene
    }, [gltf.scene, material])

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

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}