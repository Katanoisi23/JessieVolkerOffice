import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

interface BooksProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

// Карта текстур по их оригинальным ID из 3D-модели
const TEXTURE_FILES: Record<string, string> = {
    '54': '/textures/books_TextuePack/54_1-6.jpg',
    '59': '/textures/books_TextuePack/59_subnature.png',
    '64': '/textures/books_TextuePack/64_book-design-india-5.jpg',
    '77': '/textures/books_TextuePack/77_23-7.jpg',
    '86': '/textures/books_TextuePack/86_bookCover.jpg',
    '91': '/textures/books_TextuePack/91_48-4.jpg',
    '104': '/textures/books_TextuePack/104_51Ki8a0jpVL.jpg',
    '109': '/textures/books_TextuePack/109_4165335365_dfa53bb1d9.jpg',
    '114': '/textures/books_TextuePack/114_11-3.jpg',
}

export function Books({
    position = [-2.12, 2.08, 0.9],
    // Поворот: разворачиваем корешками вперед в комнату
    rotation = [0, -Math.PI / 2, 0],
    targetHeight = 0.25,
    scale = 1,
}: BooksProps) {
    const gltf = useGLTF('/models/Books.glb')
    const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene
    const clonedScene = useMemo(() => scene.clone(true), [scene])
    const groupRef = useRef<THREE.Group>(null)

    // Загружаем текстуры с правильным flipY для GLTF
    const texturesMap = useMemo(() => {
        const loader = new THREE.TextureLoader()
        const map: Record<string, THREE.Texture> = {}

        Object.entries(TEXTURE_FILES).forEach(([key, path]) => {
            const tex = loader.load(path)
            tex.colorSpace = THREE.SRGBColorSpace
            tex.flipY = false // 👈 КРИТИЧНО: предотвращает растягивание и переворот текстуры в GLTF
            map[key] = tex
        })

        return map
    }, [])

    useEffect(() => {
        const textureKeys = Object.keys(texturesMap)
        let fallbackIndex = 0

        // Материал для срезов страниц
        const pageMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#f0ece1'),
            roughness: 0.9,
            metalness: 0.0,
        })

        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false

                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals()
                }

                // Вспомогательная функция применения материала
                const resolveMaterial = (mat: THREE.Material): THREE.Material => {
                    const matName = (mat.name || '').toLowerCase()
                    const meshName = (mesh.name || '').toLowerCase()

                    // Если это страницы
                    if (/page|paper|лист|страниц/i.test(matName) || /page|paper/i.test(meshName)) {
                        return pageMaterial
                    }

                    // Ищем соответствующий ID текстуры (54, 59, 64 и т.д.) в имени материала или меша
                    let matchedKey = textureKeys.find((k) => matName.includes(k) || meshName.includes(k))

                    // Если точного ID в имени нет, берем по порядку
                    if (!matchedKey) {
                        matchedKey = textureKeys[fallbackIndex % textureKeys.length]
                        fallbackIndex++
                    }

                    const tex = texturesMap[matchedKey]
                    return new THREE.MeshStandardMaterial({
                        map: tex || null,
                        color: new THREE.Color('#ffffff'),
                        roughness: 0.45,
                        metalness: 0.05,
                        side: THREE.DoubleSide,
                    })
                }

                // Корректно сохраняем структуру: если у меша массив материалов, обновляем каждый
                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map((m) => resolveMaterial(m))
                } else if (mesh.material) {
                    mesh.material = resolveMaterial(mesh.material)
                }
            }
        })
    }, [clonedScene, texturesMap])

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
        return
    }, [clonedScene, targetHeight, scale])

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}