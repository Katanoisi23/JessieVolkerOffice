import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

export type KeyboardPreset = 'gradient' | 'twoTone' | 'retro' | 'stealth' | 'chalk'

interface KeyboardProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    preset?: KeyboardPreset
    caseColor?: string
    rowColors?: [string, string, string, string, string] // [Row0 (Spacebar), Row1, Row2, Row3, Row4 (Top)]
    backlightColor?: string
    backlightIntensity?: number
    roughness?: number
    castShadow?: boolean
    receiveShadow?: boolean
}

// Цветовые схемы клавиатур
const PRESETS: Record<KeyboardPreset, {
    case: string
    rows: [string, string, string, string, string] // от нижнего ряда (пробел) к верхнему (цифры/Esc)
    plate: string
    backlightIntensity: number
}> = {
    // Стильный вертикальный градиент (Ombré / Side-printed Gradient):
    // Верхний ряд — светло-серый / серебристый PBT, нижний ряд — глубокий матовый черный
    gradient: {
        case: '#16171a',
        rows: [
            '#1b1d22', // Ряд 0 (Пробел, Ctrl, Alt) — глубокий черный
            '#343840', // Ряд 1 (ZXCV) — темный графит
            '#555a64', // Ряд 2 (ASDF) — сланец / медиум грей
            '#878d98', // Ряд 3 (QWERTY) — светло-серый
            '#c2c6cd', // Ряд 4 (Цифры, Esc) — серебристо-пепельный
        ],
        plate: '#0f1013',
        backlightIntensity: 0, // Без подсветки
    },
    // Классический современный дуал-тон
    twoTone: {
        case: '#1b1d22',
        rows: [
            '#2e333d',
            '#eaebee',
            '#eaebee',
            '#eaebee',
            '#2e333d',
        ],
        plate: '#121417',
        backlightIntensity: 0,
    },
    // Ретро 9009
    retro: {
        case: '#cfcac0',
        rows: [
            '#a3a197',
            '#edeae1',
            '#edeae1',
            '#edeae1',
            '#a3a197',
        ],
        plate: '#252525',
        backlightIntensity: 0,
    },
    // Скрытный полностью темный стиль
    stealth: {
        case: '#121316',
        rows: [
            '#181a1f',
            '#24272f',
            '#282b33',
            '#282b33',
            '#1e2127',
        ],
        plate: '#0e0f11',
        backlightIntensity: 0,
    },
    // Белоснежный стиль
    chalk: {
        case: '#23262f',
        rows: [
            '#cbd5e1',
            '#f8fafc',
            '#f8fafc',
            '#f8fafc',
            '#cbd5e1',
        ],
        plate: '#15171c',
        backlightIntensity: 0,
    },
}

export function Keyboard({
    position = [-1.5, 1.02, -1.95],
    rotation = [4.72, 3.2, 1.55],
    targetHeight = 0.1,
    scale = 1,
    preset = 'gradient',
    caseColor,
    rowColors,
    backlightColor = '#38bdf8',
    backlightIntensity = 0, // По умолчанию выключена
    roughness = 0.38,
    castShadow = true,
    receiveShadow = true,
}: KeyboardProps) {
    const gltf = useGLTF('/models/MechKeyboard1.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Текстуры микрошероховатости формованного PBT-пластика
    const textures = useTexture({
        normal: '/textures/keyboard/plastic_normal.png',
        roughness: '/textures/keyboard/plastic_roughness.png',
    })

    const selectedPreset = PRESETS[preset] || PRESETS.gradient
    const activeCaseColor = caseColor ?? selectedPreset.case
    const activeRowColors = rowColors ?? selectedPreset.rows
    const activeBacklightIntensity = backlightIntensity ?? selectedPreset.backlightIntensity

    // Бесшовный тайлинг микротекстуры пластика
    const { normalMap, roughnessMap } = useMemo(() => {
        const nMap = textures.normal.clone()
        const rMap = textures.roughness.clone()

        nMap.wrapS = THREE.RepeatWrapping
        nMap.wrapT = THREE.RepeatWrapping
        nMap.repeat.set(16, 16)
        nMap.needsUpdate = true

        rMap.wrapS = THREE.RepeatWrapping
        rMap.wrapT = THREE.RepeatWrapping
        rMap.repeat.set(16, 16)
        rMap.needsUpdate = true

        return { normalMap: nMap, roughnessMap: rMap }
    }, [textures])

    // PBR-материалы пластика для корпуса, монтажной пластины и каждого ряда клавиш
    const materials = useMemo(() => {
        const plasticBase = {
            metalness: 0.0,
            roughness,
            roughnessMap,
            normalMap,
            normalScale: new THREE.Vector2(0.35, 0.35),
            clearcoat: 0.22, // Характерный мягкий полуглянцевый отблеск пластика на фасках
            clearcoatRoughness: 0.35,
            ior: 1.5,
            specularIntensity: 0.65,
            side: THREE.FrontSide,
        }

        // Материал корпуса (матовый черный формованный пластик)
        const caseMat = new THREE.MeshPhysicalMaterial({
            ...plasticBase,
            color: new THREE.Color(activeCaseColor),
            roughness: roughness * 1.05,
            clearcoat: 0.18,
        })

        // Материалы для 5 рядов клавиш (эффект вертикального омбре-градиента)
        const rowMats = activeRowColors.map((colHex) => {
            return new THREE.MeshPhysicalMaterial({
                ...plasticBase,
                color: new THREE.Color(colHex),
            })
        })

        // Монтажная пластина под клавишами (черный металл / матовый пластик)
        const plateMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(selectedPreset.plate),
            roughness: 0.65,
            metalness: 0.2,
        })

        return { caseMat, rowMats, plateMat }
    }, [activeCaseColor, activeRowColors, selectedPreset.plate, roughness, normalMap, roughnessMap])

    // Разделение цельной 3D-модели на корпус и ряды клавиш
    const separatedScene = useMemo(() => {
        let originalMesh: THREE.Mesh | null = null
        let originalMesh1: THREE.Mesh | null = null

        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                if (child.name === 'Mesh') originalMesh = child as THREE.Mesh
                if (child.name === 'Mesh_1') originalMesh1 = child as THREE.Mesh
            }
        })

        if (!originalMesh) return gltf.scene.clone(true)

        const geom = (originalMesh as THREE.Mesh).geometry
        const index = geom.index
        const pos = geom.attributes.position

        if (!index) return gltf.scene.clone(true)

        // Пространственный поиск островов (отдельных кнопок и корпуса)
        const posMap = new Map<string, number>()
        const posToId = new Int32Array(pos.count)
        let uniquePosCount = 0

        for (let i = 0; i < pos.count; i++) {
            const key = `${Math.round(pos.getX(i) * 100)}_${Math.round(pos.getY(i) * 100)}_${Math.round(pos.getZ(i) * 100)}`
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

        const caseIndices: number[] = []
        // 5 рядов клавиатуры: Row 0 (пробел) .. Row 4 (верхний ряд цифр)
        const rowIndices: number[][] = [[], [], [], [], []]

        for (const tris of islands.values()) {
            let minX = Infinity
            let maxX = -Infinity
            let minY = Infinity
            let maxY = -Infinity

            for (const idx of tris) {
                const x = pos.getX(idx)
                const y = pos.getY(idx)
                minX = Math.min(minX, x)
                maxX = Math.max(maxX, x)
                minY = Math.min(minY, y)
                maxY = Math.max(maxY, y)
            }

            const spanX = maxX - minX
            const centerY = (minY + maxY) / 2

            if (spanX > 20) {
                // Корпус (Case)
                caseIndices.push(...tris)
            } else {
                // Классификация по рядам на основе Y-координаты в локальной системе:
                // Row 0 (Spacebar row): Y ~ 3.8  (Y > 2.8)
                // Row 1 (ZXCV row):     Y ~ 1.9  (0.9 < Y <= 2.8)
                // Row 2 (ASDF row):     Y ~ -0.1 (-1.0 < Y <= 0.9)
                // Row 3 (QWERTY row):   Y ~ -2.0 (-3.0 < Y <= -1.0)
                // Row 4 (Number row):   Y ~ -4.0 (Y <= -3.0)
                if (centerY > 2.8) {
                    rowIndices[0].push(...tris)
                } else if (centerY > 0.9) {
                    rowIndices[1].push(...tris)
                } else if (centerY > -1.0) {
                    rowIndices[2].push(...tris)
                } else if (centerY > -3.0) {
                    rowIndices[3].push(...tris)
                } else {
                    rowIndices[4].push(...tris)
                }
            }
        }

        const rootGroup = new THREE.Group()
        rootGroup.name = 'MechanicalKeyboard'

        function buildMesh(indices: number[], material: THREE.Material, name: string) {
            const subGeom = geom.clone()
            subGeom.setIndex(indices)
            subGeom.computeVertexNormals()
            const m = new THREE.Mesh(subGeom, material)
            m.name = name
            m.castShadow = castShadow
            m.receiveShadow = receiveShadow
            m.frustumCulled = false
            return m
        }

        // 1. Корпус
        const caseMesh = buildMesh(caseIndices, materials.caseMat, 'Case')
        rootGroup.add(caseMesh)

        // 2. Ряды клавиш (0..4)
        for (let r = 0; r < 5; r++) {
            if (rowIndices[r].length > 0) {
                const rowMesh = buildMesh(rowIndices[r], materials.rowMats[r], `Row_${r}`)
                rootGroup.add(rowMesh)
            }
        }

        // 3. Клавиша Esc (Mesh_1) — принадлежит верхнему 4-му ряду
        if (originalMesh1) {
            const escGeom = (originalMesh1 as THREE.Mesh).geometry.clone()
            escGeom.computeVertexNormals()
            const escMesh = new THREE.Mesh(escGeom, materials.rowMats[4])
            escMesh.name = 'EscKey'
            escMesh.castShadow = castShadow
            escMesh.receiveShadow = receiveShadow
            escMesh.frustumCulled = false
            rootGroup.add(escMesh)
        }

        // 4. Внутренняя монтажная пластина под клавишами
        const plateGeom = new THREE.PlaneGeometry(28, 9)
        const plateMesh = new THREE.Mesh(plateGeom, materials.plateMat)
        plateMesh.position.set(0, 0, -3.1)
        plateMesh.receiveShadow = true
        rootGroup.add(plateMesh)

        return rootGroup
    }, [gltf.scene, materials, castShadow, receiveShadow])

    const defaultScale: [number, number, number] = [1, 1, 1]

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
                {/* Подсветка отключаема, по умолчанию 0 */}
                {activeBacklightIntensity > 0 && (
                    <pointLight
                        position={[0, 0.2, -2.5]}
                        color={backlightColor}
                        intensity={activeBacklightIntensity}
                        distance={12}
                        decay={2}
                    />
                )}
            </Center>
        </group>
    )
}

useGLTF.preload('/models/MechKeyboard1.glb')
