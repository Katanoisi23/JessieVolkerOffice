import { useMemo, useRef } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

export interface SlippersProps {
    modelPath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    upperColor?: string
    soleColor?: string
    castShadow?: boolean
    receiveShadow?: boolean
}

export function Slippers({
    modelPath = '/models/Slipper.glb',
    position = [0.3, 0.02, 2.69],
    rotation = [0, 0, 0],
    targetHeight = 0.07,
    scale = 1,
    upperColor = '#f5f4ef',
    soleColor = '#cc8327',
    castShadow = true,
    receiveShadow = true,
}: SlippersProps) {
    const gltf = useGLTF(modelPath)
    const groupRef = useRef<THREE.Group>(null)

    // Настройка PBR-материалов в точном соответствии с фото:
    // - Верх (hood/vamp): мягкая матовая ткань молочно-белого цвета
    // - Подошва (sole/rim): тёплый карамельно-горчичный оттенок (охра/тан)
    const { upperMaterial, soleMaterial } = useMemo(() => {
        const upperMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(upperColor),
            roughness: 0.88,
            metalness: 0.0,
            side: THREE.DoubleSide,
        })

        const soleMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(soleColor),
            roughness: 0.55,
            metalness: 0.02,
            side: THREE.DoubleSide,
        })

        return { upperMaterial: upperMat, soleMaterial: soleMat }
    }, [upperColor, soleColor])

    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = castShadow
                mesh.receiveShadow = receiveShadow
                mesh.frustumCulled = false
                if (mesh.geometry && !mesh.geometry.attributes.normal) {
                    mesh.geometry.computeVertexNormals()
                }

                // В модели Slipper.glb:
                // Node1 и Node3 — верх тапочек (тканевый свод)
                // Node2 и Node4 — подошва
                const isUpper = mesh.name === 'Node1' || mesh.name === 'Node3'
                mesh.material = isUpper ? upperMaterial : soleMaterial
            }
        })
        return scene
    }, [gltf.scene, upperMaterial, soleMaterial, castShadow, receiveShadow])

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

useGLTF.preload('/models/Slipper.glb')
