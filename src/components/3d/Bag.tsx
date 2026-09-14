import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface BagProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function Bag({
    position = [-2.2, 2.13, 2.07],
    rotation = [0, 1.6, 0],
    targetHeight = 0.3,
    scale = 1,
}: BagProps) {
    const gltf = useGLTF('/models/Bag.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка текстур сумки
    const textures = useTexture({
        map: '/textures/bag/Bag_Bag_Diffuse.png',
        normalMap: '/textures/bag/Bag_Bag_Normal.png',
        aoMap: '/textures/bag/Bag_Bag_AO.png',
        metalnessMap: '/textures/bag/Bag_Bag_Specular.png',
    })

    // Настройка PBR-материала
    const material = useMemo(() => {
        textures.map.colorSpace = THREE.SRGBColorSpace
        textures.map.flipY = false
        textures.normalMap.flipY = false
        textures.aoMap.flipY = false
        textures.metalnessMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map: textures.map,
            normalMap: textures.normalMap,
            normalScale: new THREE.Vector2(1.5, 1.5),
            aoMap: textures.aoMap,
            aoMapIntensity: 1.2, // Подчеркивает карманы, швы и складки
            metalnessMap: textures.metalnessMap, // Металл на молниях и пряжках
            roughness: 0.7, // Матовая фактура ткани/кожи рюкзака
            side: THREE.DoubleSide,
        })
    }, [textures])

    // Применяем материал ко всем частям сумки до первого рендера
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