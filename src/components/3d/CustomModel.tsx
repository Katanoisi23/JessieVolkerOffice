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
    roughness?: number
    metalness?: number
}

function normalizeAndApplyMaterial(
    object: THREE.Object3D,
    texture: THREE.Texture | null,
    texturePath?: string,
    color?: string,
    buttonColor?: string,
    roughness = 0.45,
    metalness = 0.05
) {
    const meshes: THREE.Mesh[] = []
    object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.frustumCulled = false

            if (mesh.geometry) {
                mesh.geometry.computeVertexNormals()
            }
            meshes.push(mesh)
        }
    })

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
        side: THREE.DoubleSide,
    })

    // Основной материал корпуса
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color || '#151515'),
        roughness,
        metalness,
        side: THREE.DoubleSide,
    })

    // Материал для кодового диска сейфа (если переданы только метки)
    const lockMaterial = texture
        ? new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color('#ffffff'),
            roughness: 0.3,
            metalness: 0.8,
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
    roughness?: number
    metalness?: number
    targetHeight?: number
    scale?: number | [number, number, number]
}

function GltfModel({
    modelPath,
    texture,
    texturePath,
    color,
    buttonColor,
    roughness,
    metalness,
    targetHeight,
    scale,
}: ModelSubProps) {
    const gltf = useGLTF(modelPath)
    const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene
    const clonedScene = useMemo(() => scene.clone(true), [scene])
    const groupRef = useRef<THREE.Group>(null)

    useEffect(() => {
        normalizeAndApplyMaterial(clonedScene, texture, texturePath, color, buttonColor, roughness, metalness)
    }, [clonedScene, texture, texturePath, color, buttonColor, roughness, metalness])

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
    roughness,
    metalness,
    targetHeight,
    scale,
}: ModelSubProps) {
    const obj = useLoader(OBJLoader, modelPath)
    const clonedObj = useMemo(() => obj.clone(true), [obj])

    useEffect(() => {
        normalizeAndApplyMaterial(clonedObj, texture, texturePath, color, buttonColor, roughness, metalness)
    }, [clonedObj, texture, texturePath, color, buttonColor, roughness, metalness])

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
    roughness,
    metalness,
}: CustomModelProps) {
    const isObj = useMemo(() => modelPath.toLowerCase().endsWith('.obj'), [modelPath])
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

    return (
        <group position={position} rotation={rotation}>
            {isObj ? (
                <ObjModel
                    modelPath={modelPath}
                    texture={loadedTexture}
                    texturePath={texturePath}
                    color={effectiveColor}
                    buttonColor={buttonColor}
                    roughness={effectiveRoughness}
                    metalness={effectiveMetalness}
                    targetHeight={targetHeight}
                    scale={scale}
                />
            ) : (
                <GltfModel
                    modelPath={modelPath}
                    texture={loadedTexture}
                    texturePath={texturePath}
                    color={effectiveColor}
                    buttonColor={buttonColor}
                    roughness={effectiveRoughness}
                    metalness={effectiveMetalness}
                    targetHeight={targetHeight}
                    scale={scale}
                />
            )}
        </group>
    )
}