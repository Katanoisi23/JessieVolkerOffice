import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface ShoeRackProps {
    modelPath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function ShoeRack({
    modelPath = '/models/ShoeRack.glb',
    position = [-0.8, 0, 2.8],
    rotation = [0, 0.6, 0],
    targetHeight = 0.65,
    scale = 1,
}: ShoeRackProps) {
    const gltf = useGLTF(modelPath)
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка двух комплектов текстур: для труб каркаса и полок
    const textures = useTexture({
        metalMap: '/textures/ShoeRack/Metal_BaseColor.png',
        metalNormal: '/textures/ShoeRack/Metal_Normal_OpenGL.png',
        metalRough: '/textures/ShoeRack/Metal_Roughness.png',
        metalMetal: '/textures/ShoeRack/Metal_Metalness.png',

        tubeMap: '/textures/ShoeRack/MetalTube_BaseColor.png',
        tubeNormal: '/textures/ShoeRack/MetalTube_Normal_OpenGL.png',
        tubeRough: '/textures/ShoeRack/MetalTube_Roughness.png',
        tubeMetal: '/textures/ShoeRack/MetalTube_Metalness.png',
    })

    // Настройка PBR-материалов
    const { metalMaterial, tubeMaterial } = useMemo(() => {
        textures.metalMap.colorSpace = THREE.SRGBColorSpace
        textures.tubeMap.colorSpace = THREE.SRGBColorSpace

        textures.metalMap.flipY = false
        textures.metalNormal.flipY = false
        textures.metalRough.flipY = false
        textures.metalMetal.flipY = false

        textures.tubeMap.flipY = false
        textures.tubeNormal.flipY = false
        textures.tubeRough.flipY = false
        textures.tubeMetal.flipY = false

        // Материал полок и креплений
        const metalMat = new THREE.MeshStandardMaterial({
            map: textures.metalMap,
            normalMap: textures.metalNormal,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughnessMap: textures.metalRough,
            metalnessMap: textures.metalMetal,
            transparent: true,
            alphaTest: 0.5, // Прорезает отверстия в решётках полок
            depthWrite: true,
            side: THREE.DoubleSide,
        })

        // Материал трубчатого каркаса и ножек
        const tubeMat = new THREE.MeshStandardMaterial({
            map: textures.tubeMap,
            normalMap: textures.tubeNormal,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughnessMap: textures.tubeRough,
            metalnessMap: textures.tubeMetal,
            side: THREE.DoubleSide,
        })

        return { metalMaterial: metalMat, tubeMaterial: tubeMat }
    }, [textures])

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
                    const fullName = `${mesh.name} ${mat.name || ''}`.toLowerCase()
                    if (/tube|pipe|труб|ножк|каркас/i.test(fullName)) {
                        return tubeMaterial
                    }
                    return metalMaterial
                }

                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map(resolveMat)
                } else if (mesh.material) {
                    mesh.material = resolveMat(mesh.material)
                }
            }
        })

        return scene
    }, [gltf.scene, metalMaterial, tubeMaterial])

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