import { useMemo, useEffect } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

interface JewelleryBoxProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    bodyHeight?: number
    headHeight?: number
}

export function JewelleryBox({
    position = [-2.12, 1.665, 1.3],
    rotation = [0, 1.55, 0],
    bodyHeight = 0.055,
    headHeight = 0.025,
}: JewelleryBoxProps) {
    // Загружаем две половинки шкатулки
    const bodyGltf = useGLTF('/models/SM_JewelleryBox01_Body.glb')
    const headGltf = useGLTF('/models/SM_JewelleryBox01_Head.glb')

    const clonedBody = useMemo(() => bodyGltf.scene.clone(true), [bodyGltf.scene])
    const clonedHead = useMemo(() => headGltf.scene.clone(true), [headGltf.scene])

    // Загрузка полного комплекта PBR-текстур
    const material = useMemo(() => {
        const loader = new THREE.TextureLoader()

        const map = loader.load('/textures/T_JewelleryBox/T_JewelleryBox01_D.jpg')
        map.colorSpace = THREE.SRGBColorSpace
        map.flipY = false

        const normalMap = loader.load('/textures/T_JewelleryBox/T_JewelleryBox01_N.jpg')
        normalMap.flipY = false

        const roughnessMap = loader.load('/textures/T_JewelleryBox/T_JewelleryBox01_R.jpg')
        roughnessMap.flipY = false

        const metalnessMap = loader.load('/textures/T_JewelleryBox/T_JewelleryBox01_M.jpg')
        metalnessMap.flipY = false

        const aoMap = loader.load('/textures/T_JewelleryBox/T_JewelleryBox01_AO.jpg')
        aoMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map,
            normalMap,
            roughnessMap,
            metalnessMap,
            aoMap,
            aoMapIntensity: 1.0,
            side: THREE.DoubleSide,
        })
    }, [])

    // Применяем материал и тени к обеим деталям
    useEffect(() => {
        const applyMaterial = (obj: THREE.Object3D) => {
            obj.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh
                    mesh.castShadow = true
                    mesh.receiveShadow = true
                    mesh.frustumCulled = false
                    if (mesh.geometry && !mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
                    mesh.material = material
                }
            })
        }

        applyMaterial(clonedBody)
        applyMaterial(clonedHead)
    }, [clonedBody, clonedHead, material])

    // Масштабирование корпуса
    const bodyScale = useMemo(() => {
        const box = new THREE.Box3().setFromObject(clonedBody)
        const size = new THREE.Vector3()
        box.getSize(size)
        const factor = bodyHeight / (size.y || 1)
        return [factor, factor, factor] as [number, number, number]
    }, [clonedBody, bodyHeight])

    // Масштабирование крышки
    const headScale = useMemo(() => {
        const box = new THREE.Box3().setFromObject(clonedHead)
        const size = new THREE.Vector3()
        box.getSize(size)
        const factor = headHeight / (size.y || 1)
        return [factor, factor, factor] as [number, number, number]
    }, [clonedHead, headHeight])

    return (
        <group position={position} rotation={rotation}>
            {/* 1. Корпус шкатулки */}
            <group scale={bodyScale}>
                <Center top>
                    <primitive object={clonedBody} />
                </Center>
            </group>

            {/* 2. Крышка шкатулки (точно на 5.5 см выше корпуса) */}
            <group position={[0, 0.055, 0]} scale={headScale}>
                <Center top>
                    <primitive object={clonedHead} />
                </Center>
            </group>
        </group>
    )
}