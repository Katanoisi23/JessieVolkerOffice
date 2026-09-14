import { useMemo, useRef, useEffect } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'

interface LmpProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    lightIntensity?: number
}

export function Lmp({
    position = [-2.05, 1, -1.05],
    rotation = [0, 0, 0],
    targetHeight = 0.35,
    scale = 1,
    lightIntensity = 1.0,
}: LmpProps) {
    const isRoomLightOn = useOfficeStore((state) => state.isRoomLightOn)
    const isLampOn = useOfficeStore((state) => state.isLampOn)
    const toggleLamp = useOfficeStore((state) => state.toggleLamp)

    const gltf = useGLTF('/models/Lmp.glb')
    const groupRef = useRef<THREE.Group>(null)
    const spotLightRef = useRef<THREE.SpotLight>(null)
    const spotTargetRef = useRef<THREE.Object3D>(null)

    // Привязываем целевой объект к прожектору лампы для точного направления на стол
    useEffect(() => {
        if (spotLightRef.current && spotTargetRef.current) {
            spotLightRef.current.target = spotTargetRef.current
        }
    }, [])

    // Загрузка всех текстур лампы
    const textures = useTexture({
        floor: '/textures/Lmp/FLOOR_baseColor.png',
        shadeEmissive: '/textures/Lmp/LAMP_SHADE_emissive.jpeg',
        oak: '/textures/Lmp/NATURAL_OAK_baseColor.jpeg',
        steel: '/textures/Lmp/STEEL_metallicRoughness.png',
        white: '/textures/Lmp/WHITE_metallicRoughness.png',
    })

    // Настройка материалов: мягкое, не ослепляющее свечение абажура
    const materials = useMemo(() => {
        textures.floor.colorSpace = THREE.SRGBColorSpace
        textures.oak.colorSpace = THREE.SRGBColorSpace
        textures.shadeEmissive.colorSpace = THREE.SRGBColorSpace

        textures.floor.flipY = false
        textures.shadeEmissive.flipY = false
        textures.oak.flipY = false
        textures.steel.flipY = false
        textures.white.flipY = false

        return {
            oak: new THREE.MeshStandardMaterial({
                map: textures.oak,
                roughness: 0.65,
                metalness: 0.05,
                side: THREE.DoubleSide,
            }),
            shade: new THREE.MeshStandardMaterial({
                color: isLampOn ? '#fffdf7' : '#999999',
                emissive: isLampOn ? '#ffe8cc' : '#000000',
                emissiveMap: textures.shadeEmissive,
                emissiveIntensity: isLampOn ? (isRoomLightOn ? 0.3 : 0.6) * lightIntensity : 0,
                roughness: 0.5,
                side: THREE.DoubleSide,
            }),
            steel: new THREE.MeshStandardMaterial({
                color: '#d1d5db',
                metalnessMap: textures.steel,
                roughnessMap: textures.steel,
                metalness: 0.85,
                roughness: 0.25,
                side: THREE.DoubleSide,
            }),
            floor: new THREE.MeshStandardMaterial({
                map: textures.floor,
                roughness: 0.6,
                side: THREE.DoubleSide,
            }),
            white: new THREE.MeshStandardMaterial({
                color: '#ffffff',
                roughnessMap: textures.white,
                roughness: 0.4,
                side: THREE.DoubleSide,
            }),
        }
    }, [textures])

    // Плавное и мгновенное обновление свечения абажура без пересоздания материалов и геометрии
    useEffect(() => {
        let emissivePower = 0
        if (isLampOn) {
            emissivePower = (isRoomLightOn ? 0.3 : 0.6) * lightIntensity
        }
        materials.shade.color.set(isLampOn ? '#fffdf7' : '#999999')
        materials.shade.emissive.set(isLampOn ? '#ffe8cc' : '#000000')
        materials.shade.emissiveIntensity = emissivePower
    }, [materials, isRoomLightOn, isLampOn, lightIntensity])

    // Привязка материалов к соответствующим деталям
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()

                const resolveMat = (mat: THREE.Material) => {
                    const name = `${mesh.name} ${mat.name || ''}`.toLowerCase()

                    if (/oak|wood|дуб|дерев/i.test(name)) return materials.oak
                    if (/shade|lamp|абажур|плафон|light/i.test(name)) return materials.shade
                    if (/steel|metal|сталь|винт|шарнир/i.test(name)) return materials.steel
                    if (/floor|base|подставк|основан/i.test(name)) return materials.floor
                    return materials.white
                }

                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map(resolveMat)
                } else if (mesh.material) {
                    mesh.material = resolveMat(mesh.material)
                }
            }
        })

        return scene
    }, [gltf.scene, materials])

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

    const effectiveHeight = targetHeight || 0.35
    const isLampActive = isLampOn

    // Мягкая, реалистичная интенсивность света лампы (без ослепления и пятен на стене)
    const spotIntensity = (isRoomLightOn ? 0.6 : 2.0) * lightIntensity
    const pointIntensity = (isRoomLightOn ? 0.15 : 0.4) * lightIntensity

    return (
        <group position={position} ref={groupRef}>
            {/* 3D-модель лампы с возможностью клика для включения/выключения */}
            <group
                rotation={rotation}
                scale={computedScale}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleLamp()
                }}
                onPointerOver={() => {
                    document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => {
                    document.body.style.cursor = 'auto'
                }}
            >
                <Center top>
                    <primitive object={clonedScene} />
                </Center>
            </group>

            {/* Точка на столе, куда направлен световой луч (вперед и вправо на клавиатуру) */}
            <object3D ref={spotTargetRef} position={[0.25, -0.18, 0.42]} />

            {/* Физические источники света лампы, направленные СТРОГО ВНИЗ НА СТОЛ */}
            {isLampActive && (
                <>
                    {/* 1. Направленный конус света строго на рабочую зону стола (не на стену!) */}
                    <spotLight
                        ref={spotLightRef}
                        position={[0.06, effectiveHeight * 0.8, 0.1]}
                        intensity={spotIntensity}
                        distance={2.6}
                        angle={Math.PI / 4.2}
                        penumbra={0.7}
                        color="#ffedd4"
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                        shadow-bias={-0.0003}
                    />

                    {/* 2. Деликатное локальное теплое свечение непосредственно под плафоном */}
                    <pointLight
                        position={[0.06, effectiveHeight * 0.72, 0.1]}
                        intensity={pointIntensity}
                        distance={1.6}
                        decay={2.0}
                        color="#ffe8cc"
                    />
                </>
            )}
        </group>
    )
}