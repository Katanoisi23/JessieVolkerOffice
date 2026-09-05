import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface PencilCupProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function PencilCup({
    position = [-1.9, 0.85, -0.99],
    rotation = [0, 0, 0],
    targetHeight = 0.15,
    scale = 1,
}: PencilCupProps) {
    const gltf = useGLTF('/models/Pencil_cup.glb')
    const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
    const groupRef = useRef<THREE.Group>(null)

    // Загружаем текстуры стакана с карандашами
    const textures = useTexture({
        map: '/textures/PencilCup/PencilCup_BaseColor_512.png',
        aoMap: '/textures/PencilCup/PencilCup_AO_512.png',
        roughnessMap: '/textures/PencilCup/PencilCup_Roughness_512.png',
    })

    const material = useMemo(() => {
        textures.map.colorSpace = THREE.SRGBColorSpace
        textures.map.flipY = false
        textures.aoMap.flipY = false
        textures.roughnessMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map: textures.map,
            aoMap: textures.aoMap,
            aoMapIntensity: 1.2,
            roughnessMap: textures.roughnessMap,
            transparent: true,  // Если стакан сетчатый
            alphaTest: 0.5,     // Прорезает отверстия в сетке
            depthWrite: true,
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
                if (mesh.geometry) mesh.geometry.computeVertexNormals()
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