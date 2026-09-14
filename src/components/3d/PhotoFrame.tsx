import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface PhotoFrameProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    image?: string
    frameColor?: string
    frameRoughness?: number
    frameMetalness?: number
    glass?: boolean
    glassOpacity?: number
    castShadow?: boolean
    receiveShadow?: boolean
}

export function PhotoFrame({
    position = [1.75, 1, -2.85],
    rotation = [0, -1.6, 0],
    targetHeight = 0.25,
    scale = 1,
    image = '/textures/LogoJV_framed.svg',
    frameColor = '#18191c',       // Матовая черная рамка (в тон мебели и ручкам)
    frameRoughness = 0.35,
    frameMetalness = 0.1,
    glass = true,
    glassOpacity = 0.18,
    castShadow = true,
    receiveShadow = true,
}: PhotoFrameProps) {
    const gltf = useGLTF('/models/frame.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Автоматический выбор адаптированной вертикальной версии постера с правильными пропорциями
    const resolvedImagePath = useMemo(() => {
        if (image === '/textures/LogoJV.svg') return '/textures/LogoJV_framed.svg'
        if (image === '/textures/logo_blue.png' || image === '/textures/logo_bars.png') return '/textures/LogoBlue_framed.png'
        if (image === '/textures/logo_eye.png') return '/textures/LogoEye_framed.png'
        if (image === '/textures/logo_teal.png') return '/textures/LogoTeal_framed.png'
        return image
    }, [image])
    const photoTexture = useTexture(resolvedImagePath)

    // PBR-материалы для рамки, фотографии и стекла
    const materials = useMemo(() => {
        photoTexture.colorSpace = THREE.SRGBColorSpace
        photoTexture.flipY = false // Точное соответствие верха и низа модели
        photoTexture.minFilter = THREE.LinearMipmapLinearFilter
        photoTexture.magFilter = THREE.LinearFilter
        photoTexture.generateMipmaps = true

        // 1. Материал фотографии (высококачественная сатиновая фотобумага)
        const photoMat = new THREE.MeshStandardMaterial({
            map: photoTexture,
            roughness: 0.3,
            metalness: 0.0,
            side: THREE.FrontSide,
        })

        // 2. Материал багета / рамки
        const frameMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(frameColor),
            roughness: frameRoughness,
            metalness: frameMetalness,
            clearcoat: 0.25,
            clearcoatRoughness: 0.3,
            side: THREE.DoubleSide,
        })

        // 3. Защитное стекло с тонким физическим отблеском
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#ffffff'),
            transparent: true,
            opacity: glass ? glassOpacity : 0,
            transmission: glass ? 0.92 : 1,
            roughness: 0.05,
            ior: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            side: THREE.FrontSide,
            depthWrite: false, // Предотвращает z-fighting с фотографией
        })

        return { photoMat, frameMat, glassMat }
    }, [photoTexture, frameColor, frameRoughness, frameMetalness, glass, glassOpacity])

    // Подготовка сцены: нормализация UV-координат плоскости фото и назначение материалов
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

                if (mesh.name === 'Cube_8') {
                    // Плоскость фотографии: калибруем UV-сетку под правильные неискаженные пропорции
                    const pos = mesh.geometry.attributes.position
                    if (pos) {
                        const uvs = new Float32Array(pos.count * 2)
                        for (let i = 0; i < pos.count; i++) {
                            uvs[i * 2] = pos.getX(i) > 0 ? 1 : 0
                            uvs[i * 2 + 1] = pos.getY(i) > 0 ? 0 : 1 // v=0 вверху, v=1 внизу при flipY=false
                        }
                        const newGeom = mesh.geometry.clone()
                        newGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
                        mesh.geometry = newGeom
                    }
                    mesh.material = materials.photoMat
                } else if (mesh.name === 'Cube_6') {
                    // Стекло
                    mesh.material = materials.glassMat
                } else {
                    // Корпус рамки (Cube_7)
                    mesh.material = materials.frameMat
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

useGLTF.preload('/models/frame.glb')
useTexture.preload('/textures/LogoJV_framed.svg')
useTexture.preload('/textures/LogoBlue_framed.png')
useTexture.preload('/textures/LogoEye_framed.png')
useTexture.preload('/textures/LogoTeal_framed.png')
