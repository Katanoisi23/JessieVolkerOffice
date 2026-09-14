import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface TrashcanProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function Trashcan({
    position = [-2, 0, -1.3],
    rotation = [1.45, -1.6, 1.5],
    targetHeight = 0.3,
    scale = 1,
}: TrashcanProps) {
    const gltf = useGLTF('/models/Trashcan_full.glb')
    const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
    const groupRef = useRef<THREE.Group>(null)

    // Загружаем полный PBR-комплект (берем NormalGL для Three.js)
    const textures = useTexture({
        map: '/textures/Trashcan_full/Trashcan_tex512_BaseColor.png',
        normalMap: '/textures/Trashcan_full/Trashcan_tex512_NormalGL.png',
        roughnessMap: '/textures/Trashcan_full/Trashcan_tex512_Roughness.png',
        metalnessMap: '/textures/Trashcan_full/Trashcan_tex512_Metallic.png',
    })

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
            transparent: true,  // Включаем чтение альфа-канала текстуры
            alphaTest: 0.5,     // Прорезает отверстия в сетке корзины
            depthWrite: true,   // Корректно отрисовывает прутья и внутренности корзины
            side: THREE.DoubleSide,
        })
    }, [textures])

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