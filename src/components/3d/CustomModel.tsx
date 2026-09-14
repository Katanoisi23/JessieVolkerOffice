import { useMemo, useEffect, useRef, useState } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import * as THREE from 'three'

interface CustomModelProps {
    modelPath: string
    texturePath?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    color?: string
    buttonColor?: string // Для моделей с кнопкой/застёжкой
    upperColor?: string // Для тапочек/обуви
    soleColor?: string
    roughness?: number
    metalness?: number
    clearcoat?: number
    clearcoatRoughness?: number
    castShadow?: boolean
    receiveShadow?: boolean
}

function normalizeAndApplyMaterial(
    object: THREE.Object3D,
    texture: THREE.Texture | null,
    texturePath?: string,
    color?: string,
    buttonColor?: string,
    roughness = 0.45,
    metalness = 0.05,
    clearcoat = 0,
    clearcoatRoughness = 0.2,
    castShadow = true,
    receiveShadow = true,
    modelPath?: string,
    upperColor?: string,
    soleColor?: string
) {
    const meshes: THREE.Mesh[] = []
    object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = castShadow
            mesh.receiveShadow = receiveShadow
            mesh.frustumCulled = false

            if (mesh.geometry && !mesh.geometry.attributes.normal) {
                mesh.geometry.computeVertexNormals()
            }
            meshes.push(mesh)
        }
    })

    // Проверяем, является ли модель тапочками (Slipper.glb)
    const isSlipper = /slipper/i.test(modelPath || '') || (meshes.length === 4 && meshes.some(m => m.name === 'Node1' || m.name === 'Node3'))

    if (isSlipper) {
        // Настройка PBR-материалов в точном соответствии с фото:
        // - Верх (свод): мягкая белая ткань
        // - Подошва: тёплый карамельно-горчичный оттенок (охра/тан)
        const upperMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(upperColor || '#f5f4ef'),
            roughness: 0.88,
            metalness: 0.0,
            flatShading: true,
            side: THREE.DoubleSide,
        })
        const soleMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(soleColor || '#cc8327'),
            roughness: 0.55,
            metalness: 0.02,
            flatShading: true,
            side: THREE.DoubleSide,
        })

        meshes.forEach((mesh) => {
            const isUpper = mesh.name === 'Node1' || mesh.name === 'Node3' || (new THREE.Box3().setFromObject(mesh).max.y > 1.65)
            mesh.material = isUpper ? upperMat : soleMat
        })
        return
    }

    // Если передан buttonColor и в модели 2 детали — определяем меньшую как кнопку
    let buttonMesh: THREE.Mesh | null = null
    if (buttonColor && meshes.length === 2) {
        const [meshA, meshB] = meshes

        const sizeA = new THREE.Box3().setFromObject(meshA).getSize(new THREE.Vector3()).length()
        const sizeB = new THREE.Box3().setFromObject(meshB).getSize(new THREE.Vector3()).length()

        buttonMesh = sizeA < sizeB ? meshA : meshB
    }

    // Материал кнопки (белый с металлическим глянцем)
    const buttonMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(buttonColor || '#ffffff'),
        roughness: 0.25,
        metalness: 0.7,
        flatShading: true,
        side: THREE.DoubleSide,
    })

    // Основной материал корпуса (MeshPhysicalMaterial для стильного пластика/покрытий)
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color || '#151515'),
        roughness,
        metalness,
        clearcoat,
        clearcoatRoughness,
        ior: 1.5,
        specularIntensity: 0.7,
        flatShading: true,
        side: THREE.DoubleSide,
    })

    // Материал для кодового диска сейфа (если переданы только метки)
    const lockMaterial = texture
        ? new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color('#ffffff'),
            roughness: 0.3,
            metalness: 0.8,
            flatShading: true,
            side: THREE.DoubleSide,
        })
        : bodyMaterial

    // Проверяем, передана ли текстура только для меток замка
    const isMarkersOnly = /markers|marker/i.test(texturePath || '')
    const hasLockDial = meshes.some((m) => m.name === 'Lock' || m.name === 'Knob')

    meshes.forEach((mesh) => {
        const isLockDial = mesh.name === 'Lock' || mesh.name === 'Knob'
        const isButton = mesh === buttonMesh || /button|snap|rivet|knob|pin/i.test(mesh.name)

        if (buttonColor && isButton) {
            // Кнопка на клатче/чехле
            mesh.material = buttonMaterial
        } else if (texture && hasLockDial && isMarkersOnly) {
            // Только если текстура исключительно для меток замка
            mesh.material = isLockDial ? lockMaterial : bodyMaterial
        } else if (texture) {
            // 👈 Сейф с safe.jpg, бумага и любые другие модели — накладываем текстуру на весь меш
            mesh.material = new THREE.MeshStandardMaterial({
                map: texture,
                color: new THREE.Color(color || '#ffffff'),
                roughness,
                metalness,
                flatShading: true,
                side: THREE.DoubleSide,
            })
        } else {
            mesh.material = bodyMaterial
        }
    })
}

interface ModelSubProps {
    modelPath: string
    texture: THREE.Texture | null
    texturePath?: string
    color?: string
    buttonColor?: string
    upperColor?: string
    soleColor?: string
    roughness?: number
    metalness?: number
    clearcoat?: number
    clearcoatRoughness?: number
    targetHeight?: number
    scale?: number | [number, number, number]
    castShadow?: boolean
    receiveShadow?: boolean
}

function GltfModel({
    modelPath,
    texture,
    texturePath,
    color,
    buttonColor,
    upperColor,
    soleColor,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    targetHeight,
    scale,
    castShadow,
    receiveShadow,
}: ModelSubProps) {
    const gltf = useGLTF(modelPath)
    const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene
    const clonedScene = useMemo(() => {
        const s = scene.clone(true)
        s.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.frustumCulled = false
            }
        })
        return s
    }, [scene])
    const groupRef = useRef<THREE.Group>(null)

    useEffect(() => {
        normalizeAndApplyMaterial(
            clonedScene,
            texture,
            texturePath,
            color,
            buttonColor,
            roughness,
            metalness,
            clearcoat,
            clearcoatRoughness,
            castShadow,
            receiveShadow,
            modelPath,
            upperColor,
            soleColor
        )
    }, [clonedScene, texture, texturePath, color, buttonColor, roughness, metalness, clearcoat, clearcoatRoughness, castShadow, receiveShadow, modelPath, upperColor, soleColor])

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
        <group ref={groupRef} scale={computedScale}>
            <Center top>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}

function ObjModel({
    modelPath,
    texture,
    texturePath,
    color,
    buttonColor,
    upperColor,
    soleColor,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    targetHeight,
    scale,
    castShadow,
    receiveShadow,
}: ModelSubProps) {
    const obj = useLoader(OBJLoader, modelPath)
    const clonedObj = useMemo(() => {
        const o = obj.clone(true)
        o.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.frustumCulled = false
            }
        })
        return o
    }, [obj])

    useEffect(() => {
        normalizeAndApplyMaterial(
            clonedObj,
            texture,
            texturePath,
            color,
            buttonColor,
            roughness,
            metalness,
            clearcoat,
            clearcoatRoughness,
            castShadow,
            receiveShadow,
            modelPath,
            upperColor,
            soleColor
        )
    }, [clonedObj, texture, texturePath, color, buttonColor, roughness, metalness, clearcoat, clearcoatRoughness, castShadow, receiveShadow, modelPath, upperColor, soleColor])

    const defaultScale: [number, number, number] = [1, 1, 1]

    const computedScale: [number, number, number] = useMemo(() => {
        if (targetHeight) {
            const box = new THREE.Box3().setFromObject(clonedObj)
            const size = new THREE.Vector3()
            box.getSize(size)
            const currentHeight = size.y || 1
            const factor = targetHeight / currentHeight
            return [factor, factor, factor]
        }
        if (Array.isArray(scale)) return scale
        if (typeof scale === 'number') return [scale, scale, scale]
        return defaultScale
    }, [clonedObj, targetHeight, scale])

    return (
        <group scale={computedScale}>
            <Center top>
                <primitive object={clonedObj} />
            </Center>
        </group>
    )
}

export function CustomModel({
    modelPath,
    texturePath,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    targetHeight,
    scale = 1,
    color,
    buttonColor,
    upperColor,
    soleColor,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    castShadow,
    receiveShadow = true,
}: CustomModelProps) {
    const isObj = useMemo(() => modelPath.toLowerCase().endsWith('.obj'), [modelPath])
    const isSlipper = useMemo(() => /slipper/i.test(modelPath), [modelPath])
    const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | null>(null)

    useEffect(() => {
        if (!texturePath) {
            setLoadedTexture(null)
            return
        }

        const loader = new THREE.TextureLoader()
        loader.load(
            texturePath,
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace
                tex.flipY = false
                setLoadedTexture(tex)
            },
            undefined,
            (err) => {
                console.error(`Не удалось загрузить текстуру: ${texturePath}`, err)
            }
        )
    }, [texturePath])

    const effectiveColor = color ?? (buttonColor ? '#151515' : texturePath ? '#ffffff' : '#d8be9b')
    const effectiveRoughness = roughness ?? (buttonColor ? 0.65 : texturePath ? 0.4 : 0.45)
    const effectiveMetalness = metalness ?? (texturePath ? 0.6 : 0.05)
    // Мелкие объекты (< 15 см) не отбрасывают тени для экономии производительности, но тапочки на полу должны отбрасывать контактную тень
    const effectiveCastShadow = castShadow ?? (isSlipper ? true : targetHeight !== undefined ? targetHeight >= 0.15 : true)

    return (
        <group position={position} rotation={rotation}>
            {isObj ? (
                <ObjModel
                    modelPath={modelPath}
                    texture={loadedTexture}
                    texturePath={texturePath}
                    color={effectiveColor}
                    buttonColor={buttonColor}
                    upperColor={upperColor}
                    soleColor={soleColor}
                    roughness={effectiveRoughness}
                    metalness={effectiveMetalness}
                    clearcoat={clearcoat}
                    clearcoatRoughness={clearcoatRoughness}
                    targetHeight={targetHeight}
                    scale={scale}
                    castShadow={effectiveCastShadow}
                    receiveShadow={receiveShadow}
                />
            ) : (
                <GltfModel
                    modelPath={modelPath}
                    texture={loadedTexture}
                    texturePath={texturePath}
                    color={effectiveColor}
                    buttonColor={buttonColor}
                    upperColor={upperColor}
                    soleColor={soleColor}
                    roughness={effectiveRoughness}
                    metalness={effectiveMetalness}
                    clearcoat={clearcoat}
                    clearcoatRoughness={clearcoatRoughness}
                    targetHeight={targetHeight}
                    scale={scale}
                    castShadow={effectiveCastShadow}
                    receiveShadow={receiveShadow}
                />
            )}
        </group>
    )
}