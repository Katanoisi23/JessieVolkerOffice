import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

export type TableHandleStyle = 'silver' | 'black' | 'gold'

interface TableProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    bodyColor?: string
    useWoodTexture?: boolean
    handleStyle?: TableHandleStyle
    handleColor?: string
    castShadow?: boolean
    receiveShadow?: boolean
}

const HANDLE_STYLES: Record<TableHandleStyle, { color: string; metalness: number; roughness: number }> = {
    // Матовый черный металл (в тон ручкам шкафа)
    black: {
        color: '#1a1c1e',
        metalness: 0.85,
        roughness: 0.32,
    },
    // Матовая шлифованная сталь / алюминий
    silver: {
        color: '#d6dae0',
        metalness: 0.9,
        roughness: 0.22,
    },
    // Теплая матовая латунь / шампань
    gold: {
        color: '#cbb07a',
        metalness: 0.9,
        roughness: 0.25,
    },
}

export function Table({
    position = [1.3, 0.5, -5],
    rotation = [1.6, 0, -0.43],
    targetHeight = 0.75,
    scale = 1,
    bodyColor = '#f5f4ef',       // Мягкий скандинавский сатиновый белый
    useWoodTexture = false,      // По умолчанию чистое современное белое покрытие
    handleStyle = 'black',       // Черные рукоятки
    handleColor,
    castShadow = true,
    receiveShadow = true,
}: TableProps) {
    const gltf = useGLTF('/models/Table.glb')
    const groupRef = useRef<THREE.Group>(null)

    const woodTexture = useTexture('/textures/table/seamless-wood-texture-1.jpg')

    const activeHandleStyle = HANDLE_STYLES[handleStyle] || HANDLE_STYLES.black
    const resolvedHandleColor = handleColor ?? activeHandleStyle.color

    const materials = useMemo(() => {
        woodTexture.colorSpace = THREE.SRGBColorSpace
        woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping
        woodTexture.repeat.set(2.0, 2.0)

        // Материал столешницы, тумб и ящиков (белый сатиновый лак или дерево)
        const bodyMaterial = useWoodTexture
            ? new THREE.MeshStandardMaterial({
                map: woodTexture,
                roughness: 0.42,
                metalness: 0.05,
                side: THREE.DoubleSide,
            })
            : new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(bodyColor),
                roughness: 0.35,
                metalness: 0.0,
                clearcoat: 0.22,
                clearcoatRoughness: 0.3,
                ior: 1.5,
                specularIntensity: 0.65,
                side: THREE.DoubleSide,
            })

        // Металлический материал для рукояток ящиков (черный металл по умолчанию)
        const handleMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(resolvedHandleColor),
            metalness: activeHandleStyle.metalness,
            roughness: activeHandleStyle.roughness,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
            side: THREE.DoubleSide,
        })

        return { bodyMaterial, handleMaterial }
    }, [woodTexture, useWoodTexture, bodyColor, resolvedHandleColor, activeHandleStyle])

    const separatedScene = useMemo(() => {
        let originalMesh: THREE.Mesh | null = null
        gltf.scene.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
                originalMesh = c as THREE.Mesh
            }
        })

        if (!originalMesh) return gltf.scene.clone(true)

        const geom = (originalMesh as THREE.Mesh).geometry
        const index = geom.index
        const pos = geom.attributes.position
        const normal = geom.attributes.normal

        if (!index || !pos) return gltf.scene.clone(true)

        // 1. Генерируем планарные/кубические UV-координаты (в модели их изначально не было,
        // из-за чего текстура дерева не отображалась)
        const uvs = new Float32Array(pos.count * 2)
        const uvScale = 0.0015
        for (let i = 0; i < pos.count; i++) {
            const nx = normal ? Math.abs(normal.getX(i)) : 0
            const ny = normal ? Math.abs(normal.getY(i)) : 1
            const nz = normal ? Math.abs(normal.getZ(i)) : 0
            const x = pos.getX(i)
            const y = pos.getY(i)
            const z = pos.getZ(i)

            let u: number, v: number
            if (ny >= nx && ny >= nz) {
                u = x * uvScale
                v = z * uvScale
            } else if (nx >= ny && nx >= nz) {
                u = z * uvScale
                v = y * uvScale
            } else {
                u = x * uvScale
                v = y * uvScale
            }
            uvs[i * 2] = u
            uvs[i * 2 + 1] = v
        }

        const enrichedGeom = geom.clone()
        enrichedGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        enrichedGeom.computeVertexNormals()

        // 2. Пространственная группировка полигонов для отделения ручек от корпуса
        const posMap = new Map<string, number>()
        const posToId = new Int32Array(pos.count)
        let uniquePosCount = 0

        for (let i = 0; i < pos.count; i++) {
            const key = `${Math.round(pos.getX(i) * 10)}_${Math.round(pos.getY(i) * 10)}_${Math.round(pos.getZ(i) * 10)}`
            let id = posMap.get(key)
            if (id === undefined) {
                id = uniquePosCount++
                posMap.set(key, id)
            }
            posToId[i] = id
        }

        const parent = new Int32Array(uniquePosCount)
        for (let i = 0; i < uniquePosCount; i++) parent[i] = i

        function find(i: number): number {
            let r = i
            while (r !== parent[r]) r = parent[r]
            let c = i
            while (c !== r) {
                const n = parent[c]
                parent[c] = r
                c = n
            }
            return r
        }

        function union(i: number, j: number) {
            const ri = find(i)
            const rj = find(j)
            if (ri !== rj) parent[ri] = rj
        }

        for (let t = 0; t < index.count; t += 3) {
            union(posToId[index.getX(t)], posToId[index.getX(t + 1)])
            union(posToId[index.getX(t + 1)], posToId[index.getX(t + 2)])
        }

        const islands = new Map<number, number[]>()
        for (let t = 0; t < index.count; t += 3) {
            const i0 = index.getX(t)
            const i1 = index.getX(t + 1)
            const i2 = index.getX(t + 2)
            const root = find(posToId[i0])
            let list = islands.get(root)
            if (!list) {
                list = []
                islands.set(root, list)
            }
            list.push(i0, i1, i2)
        }

        const handleIndices: number[] = []
        const bodyIndices: number[] = []

        for (const tris of islands.values()) {
            let minX = Infinity
            let maxX = -Infinity
            let minY = Infinity
            let maxY = -Infinity
            let minZ = Infinity
            let maxZ = -Infinity
            for (const idx of tris) {
                minX = Math.min(minX, pos.getX(idx))
                maxX = Math.max(maxX, pos.getX(idx))
                minY = Math.min(minY, pos.getY(idx))
                maxY = Math.max(maxY, pos.getY(idx))
                minZ = Math.min(minZ, pos.getZ(idx))
                maxZ = Math.max(maxZ, pos.getZ(idx))
            }
            const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ)

            // Все ручки ящиков имеют максимальный габарит менее 20 см (200 единиц)
            if (maxDim < 200) {
                handleIndices.push(...tris)
            } else {
                bodyIndices.push(...tris)
            }
        }

        const rootGroup = new THREE.Group()
        rootGroup.name = 'OfficeDesk'

        // Меш корпуса стола (сатиновый белый или дерево)
        const bodyGeom = enrichedGeom.clone()
        bodyGeom.setIndex(bodyIndices)
        bodyGeom.computeVertexNormals()
        const bodyMesh = new THREE.Mesh(bodyGeom, materials.bodyMaterial)
        bodyMesh.name = 'DeskBody'
        bodyMesh.castShadow = castShadow
        bodyMesh.receiveShadow = receiveShadow
        bodyMesh.frustumCulled = false
        rootGroup.add(bodyMesh)

        // Меш металлических рукояток
        const handleGeom = enrichedGeom.clone()
        handleGeom.setIndex(handleIndices)
        handleGeom.computeVertexNormals()
        const handleMesh = new THREE.Mesh(handleGeom, materials.handleMaterial)
        handleMesh.name = 'DeskHandles'
        handleMesh.castShadow = castShadow
        handleMesh.receiveShadow = receiveShadow
        handleMesh.frustumCulled = false
        rootGroup.add(handleMesh)

        return rootGroup
    }, [gltf.scene, materials, castShadow, receiveShadow])

    const defaultScale: [number, number, number] = [0.5, 0.5, 0.5]

    const computedScale: [number, number, number] = useMemo(() => {
        if (targetHeight) {
            const box = new THREE.Box3().setFromObject(separatedScene)
            const size = new THREE.Vector3()
            box.getSize(size)
            const currentHeight = size.y || 1
            const factor = targetHeight / currentHeight
            return [factor, factor, factor]
        }
        if (Array.isArray(scale)) return scale
        if (typeof scale === 'number') return [scale, scale, scale]
        return defaultScale
    }, [separatedScene, targetHeight, scale])

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={separatedScene} />
            </Center>
        </group>
    )
}

useGLTF.preload('/models/Table.glb')