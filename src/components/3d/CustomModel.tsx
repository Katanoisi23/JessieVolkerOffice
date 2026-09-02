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
    roughness?: number
    metalness?: number
}

function normalizeAndApplyMaterial(
    object: THREE.Object3D,
    texture: THREE.Texture | null,
    color?: string,
    roughness = 0.45,
    metalness = 0.05
) {
    object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.frustumCulled = false

            if (mesh.geometry) {
                mesh.geometry.computeVertexNormals()
            }

            if (texture || color) {
                mesh.material = new THREE.MeshStandardMaterial({
                    map: texture || null,
                    color: new THREE.Color(color || '#ffffff'),
                    roughness,
                    metalness,
                    side: THREE.DoubleSide,
                })
            }
        }
    })
}

interface ModelSubProps {
    modelPath: string
    texture: THREE.Texture | null
    color?: string
    roughness?: number
    metalness?: number
    targetHeight?: number
    scale?: number | [number, number, number]
}

function GltfModel({
    modelPath,
    texture,
    color,
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
        normalizeAndApplyMaterial(clonedScene, texture, color, roughness, metalness)
    }, [clonedScene, texture, color, roughness, metalness])

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
    color,
    roughness,
    metalness,
    targetHeight,
    scale,
}: ModelSubProps) {
    const obj = useLoader(OBJLoader, modelPath)
    const clonedObj = useMemo(() => obj.clone(true), [obj])

    useEffect(() => {
        normalizeAndApplyMaterial(clonedObj, texture, color, roughness, metalness)
    }, [clonedObj, texture, color, roughness, metalness])

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
        return
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
    roughness = 0.45,
    metalness = 0.05,
}: CustomModelProps) {
    const isObj = useMemo(() => modelPath.toLowerCase().endsWith('.obj'), [modelPath])
    const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | null>(null)

    // Загрузка текстуры без падения Suspense
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
                setLoadedTexture(tex)
            },
            undefined,
            (err) => {
                console.error(`Не удалось загрузить текстуру: ${texturePath}`, err)
            }
        )
    }, [texturePath])

    const effectiveColor = color ?? (texturePath ? '#ffffff' : '#d8be9b')

    return (
        <group position={position} rotation={rotation}>
            {isObj ? (
                <ObjModel
                    modelPath={modelPath}
                    texture={loadedTexture}
                    color={effectiveColor}
                    roughness={roughness}
                    metalness={metalness}
                    targetHeight={targetHeight}
                    scale={scale}
                />
            ) : (
                <GltfModel
                    modelPath={modelPath}
                    texture={loadedTexture}
                    color={effectiveColor}
                    roughness={roughness}
                    metalness={metalness}
                    targetHeight={targetHeight}
                    scale={scale}
                />
            )}
        </group>
    )
}