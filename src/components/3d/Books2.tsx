import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface Books2Props {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function Books2({
    position = [1.8, 0.9, -3.25],
    rotation = [0, -1.6, 0],
    targetHeight = 0.3,
    scale = 1,
}: Books2Props) {
    const gltf = useGLTF('/models/books_TextuePack_2.glb')
    const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка полного PBR-атласа книг
    const textures = useTexture({
        map: '/textures/books_TextuePack_2/book_set_book_set_BaseColor.png',
        normalMap: '/textures/books_TextuePack_2/book_set_book_set_Normal.png',
        roughnessMap: '/textures/books_TextuePack_2/book_set_book_set_Roughness.png',
        metalnessMap: '/textures/books_TextuePack_2/book_set_book_set_Metallic.png',
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
        })
    }, [textures])

    // Применяем материал ко всем частям набора книг
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

    // Автоматическое масштабирование под желаемую высоту
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