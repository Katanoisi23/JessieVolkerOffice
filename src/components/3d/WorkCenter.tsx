import { useMemo, useRef } from 'react'
import { useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

interface WorkCenterProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
}

export function WorkCenter({
    position = [-1.75, 0, -2],
    rotation = [0, Math.PI / 2, 0],
    targetHeight = 0.75,
    scale = 1,
}: WorkCenterProps) {
    const gltf = useGLTF('/models/WorkCenter.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Очищаем модель от встроенного огромного пола (Plane) и студийного света (Area, Camera)
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)
        const toRemove: THREE.Object3D[] = []

        scene.traverse((child) => {
            // В исходном файле WorkCenter.glb есть студийный пол-плоскость масштабом 9500 единиц
            if (
                child.name === 'Plane' ||
                child.name.startsWith('Area') ||
                child.name === 'Camera'
            ) {
                toRemove.push(child)
                return
            }

            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false

                if (mesh.geometry && !mesh.geometry.attributes.normal) {
                    mesh.geometry.computeVertexNormals()
                }
            }
        })

        // Удаляем пол и лишние студийные ноды из сцены
        toRemove.forEach((obj) => {
            obj.removeFromParent?.()
            if (obj.parent) obj.parent.remove(obj)
        })

        return scene
    }, [gltf.scene])

    // Точный расчет масштаба стола без паразитного пола
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
        return [1, 1, 1]
    }, [clonedScene, targetHeight, scale])

    return (
        <group position={position} rotation={rotation} scale={computedScale} ref={groupRef}>
            {/* Center bottom ставит ножки стола ровно на пол комнаты (Y=0) */}
            <Center bottom>
                <primitive object={clonedScene} />
            </Center>
        </group>
    )
}
