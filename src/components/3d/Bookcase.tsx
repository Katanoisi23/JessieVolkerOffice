import { useMemo, useRef } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

interface BookcaseProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    bodyColor?: string
    doorColor?: string
    handleColor?: string
    backColor?: string
    shelfColor?: string
    roughness?: number
    castShadow?: boolean
    receiveShadow?: boolean
}

export function Bookcase({
    position = [1.75, 0, -3],
    rotation = [0, 4.7, 0],
    targetHeight = 2.2,
    scale = 1,
    bodyColor = '#f5f4ef',       // Мягкий скандинавский полуматовый белый
    doorColor = '#f7f6f2',       // Фасады дверец (чистый сатиновый белый)
    handleColor = '#18191c',     // Контрастные черные металлические ручки
    backColor = '#e5e2d8',       // Задняя стенка полок с естественной глубиной
    shelfColor = '#f2f1ec',      // Полки
    roughness = 0.35,            // Фактура гладкого мебельного МДФ/лака
    castShadow = true,
    receiveShadow = true,
}: BookcaseProps) {
    const gltf = useGLTF('/models/Rockworth.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Настройка PBR-материалов для деталей шкафа
    const materials = useMemo(() => {
        // Черные матовые металлические ручки
        const handleMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(handleColor),
            roughness: 0.3,
            metalness: 0.85,
            clearcoat: 0.25,
            clearcoatRoughness: 0.25,
            side: THREE.DoubleSide,
        })

        // Замочная скважина / замок
        const lockMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#23252a'),
            roughness: 0.25,
            metalness: 0.9,
            side: THREE.DoubleSide,
        })

        // Фасады дверей (сатиновый белый мебельный лак)
        const doorMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(doorColor),
            roughness,
            metalness: 0.0,
            clearcoat: 0.25,
            clearcoatRoughness: 0.3,
            ior: 1.5,
            specularIntensity: 0.65,
            side: THREE.DoubleSide,
        })

        // Основной корпус (боковины, верх, цоколь)
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(bodyColor),
            roughness: roughness * 1.05,
            metalness: 0.0,
            clearcoat: 0.2,
            clearcoatRoughness: 0.35,
            ior: 1.5,
            specularIntensity: 0.6,
            side: THREE.DoubleSide,
        })

        // Полки внутри шкафа
        const shelfMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(shelfColor),
            roughness: roughness * 1.02,
            metalness: 0.0,
            clearcoat: 0.18,
            clearcoatRoughness: 0.35,
            side: THREE.DoubleSide,
        })

        // Задняя стенка шкафа (дает объем и глубину книгам и сейфу)
        const backMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(backColor),
            roughness: 0.6,
            metalness: 0.05,
            side: THREE.DoubleSide,
        })

        return { handleMat, lockMat, doorMat, bodyMat, shelfMat, backMat }
    }, [bodyColor, doorColor, handleColor, backColor, shelfColor, roughness])

    // Применяем материалы к деталям модели
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

                const id = parseInt(mesh.name.replace('Obj_', ''))

                if (id >= 11 && id <= 30) {
                    // Ручки дверей
                    mesh.material = materials.handleMat
                } else if (id >= 7 && id <= 10) {
                    // Замок
                    mesh.material = materials.lockMat
                } else if (id >= 31 && id <= 40) {
                    // Дверцы
                    mesh.material = materials.doorMat
                } else if (id === 104 || id === 119 || id === 120 || id === 122) {
                    // Задняя панель полок
                    mesh.material = materials.backMat
                } else if (id >= 105 && id <= 116) {
                    // Полки
                    mesh.material = materials.shelfMat
                } else {
                    // Корпус (боковины, верх, база)
                    mesh.material = materials.bodyMat
                }
            }
        })

        return scene
    }, [gltf.scene, materials, castShadow, receiveShadow])

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

useGLTF.preload('/models/Rockworth.glb')
