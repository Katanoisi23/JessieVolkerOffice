import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface VaseProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function Vase({
    position = [0.65, 1.68, 1.42],
    rotation = [0, 0, 0],
    targetHeight = 0.3,
    scale = 1,
}: VaseProps) {
    const gltf = useGLTF('/models/vase.glb')
    const groupRef = useRef<THREE.Group>(null)

    // 1. Загрузка PBR-текстур золота
    const textures = useTexture({
        map: '/textures/vase/Clean Gold_baseColor.png',
        normalMap: '/textures/vase/Clean Gold_normal.png',
        roughnessMap: '/textures/vase/Clean Gold_roughness.png',
        metalnessMap: '/textures/vase/Clean Gold_metallic.png',
    })

    // 2. Создание точных материалов
    const materials = useMemo(() => {
        textures.map.colorSpace = THREE.SRGBColorSpace
        textures.map.flipY = false
        textures.normalMap.flipY = false
        textures.roughnessMap.flipY = false
        textures.metalnessMap.flipY = false

        // Золото Clean Gold для ободка и пояска
        const goldMat = new THREE.MeshStandardMaterial({
            map: textures.map,
            normalMap: textures.normalMap,
            roughnessMap: textures.roughnessMap,
            metalnessMap: textures.metalnessMap,
            side: THREE.DoubleSide,
        })

        // Прозрачное стекло флакона
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transmission: 0.98,
            opacity: 1,
            transparent: true,
            roughness: 0.05,
            ior: 1.5,
            thickness: 0.05,
            depthWrite: false,
            side: THREE.DoubleSide,
        })

        // Лавандово-фиолетовая жидкость
        const liquidMat = new THREE.MeshPhysicalMaterial({
            color: '#8b5cf6',
            transmission: 0.6,
            transparent: true,
            opacity: 0.9,
            roughness: 0.1,
            ior: 1.33,
            depthWrite: false,
            side: THREE.DoubleSide,
        })

        // Темные ротанговые палочки
        const sticksMat = new THREE.MeshStandardMaterial({
            color: '#1f132b',
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide,
        })

        return { goldMat, glassMat, liquidMat, sticksMat }
    }, [textures])

    // 3. Прямая привязка материалов по именам мешей
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        const STICK_NODES = new Set(['Node3', 'Node4', 'Node6', 'Node7', 'Node8'])

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()

                if (STICK_NODES.has(mesh.name)) {
                    // Все 5 палочек
                    mesh.material = materials.sticksMat
                    mesh.renderOrder = 0
                } else if (mesh.name === 'Node1' || mesh.name === 'Node9') {
                    // Золотой ободок горлышка (Node1) и золотой поясок (Node9)
                    mesh.material = materials.goldMat
                    mesh.renderOrder = 0
                } else if (mesh.name === 'Node5') {
                    // Фиолетовая жидкость
                    mesh.material = materials.liquidMat
                    mesh.renderOrder = 1
                } else if (mesh.name === 'Node2') {
                    // Стеклянный флакон
                    mesh.material = materials.glassMat
                    mesh.renderOrder = 2
                } else {
                    mesh.material = materials.glassMat
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

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}