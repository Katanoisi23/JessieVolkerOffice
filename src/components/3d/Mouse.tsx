import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface MouseProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function Mouse({
    position = [-1.5, 0.85, -2.3],
    rotation = [1.45, -1.6, 1.5],
    targetHeight = 0.035, // Высота компьютерной мыши ~3.5 см
    scale = 1,
}: MouseProps) {
    const gltf = useGLTF('/models/Mouse.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Загружаем полный PBR-комплект (берем Normal_OpenGL для Three.js)
    const textures = useTexture({
        map: '/textures/mouse/Mouse_Material_Base_Color_1001.png',
        normalMap: '/textures/mouse/Mouse_Material_Normal_OpenGL_1001.png',
        roughnessMap: '/textures/mouse/Mouse_Material_Roughness_1001.png',
        metalnessMap: '/textures/mouse/Mouse_Material_Metallic_1001.png',
        aoMap: '/textures/mouse/Mouse_Material_Mixed_AO_1001.png',
    })

    // Настройка PBR-материала (плотный, без артефактов прозрачности)
    const material = useMemo(() => {
        textures.map.colorSpace = THREE.SRGBColorSpace
        textures.map.flipY = false
        textures.normalMap.flipY = false
        textures.roughnessMap.flipY = false
        textures.metalnessMap.flipY = false
        textures.aoMap.flipY = false

        return new THREE.MeshStandardMaterial({
            map: textures.map,
            normalMap: textures.normalMap,
            normalScale: new THREE.Vector2(1.5, 1.5),
            roughnessMap: textures.roughnessMap,
            metalnessMap: textures.metalnessMap,
            aoMap: textures.aoMap,
            aoMapIntensity: 1.2, // Подчеркивает стыки кнопок и колесико
            side: THREE.DoubleSide,
        })
    }, [textures])

    // Применяем материал ко всем деталям мыши до первого рендера
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()
                mesh.material = material
            }
        })
        return scene
    }, [gltf.scene, material])

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