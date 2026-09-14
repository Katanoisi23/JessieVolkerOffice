import { useMemo, useRef } from 'react'
import { useGLTF, useTexture, Center } from '@react-three/drei'
import * as THREE from 'three'

interface ComputerProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    caseColor?: string
    castShadow?: boolean
    receiveShadow?: boolean
}

export function Computer({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    targetHeight = 1,
    scale = 1,
    caseColor = '#18191d',       // Премиальный глубокий черный матовый металл корпуса
    castShadow = true,
    receiveShadow = true,
}: ComputerProps) {
    const gltf = useGLTF('/models/Comp.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка всех текстур корпуса
    const textures = useTexture({
        dvd: '/textures/comp/cdroompng.png',
        psu: '/textures/comp/TexturesCom_Electronics0024_1_M.jpg',
        io: '/textures/comp/Untiatled.png',
        pcie: '/textures/comp/Untaitled.png',
        powerButton: '/textures/comp/power-symbol-7.png',
        badge: '/textures/comp/letter-s36.jpg',
    })

    // Настройка PBR-материалов для всех узлов системного блока
    const materials = useMemo(() => {
        // Текстуры для моделей Blender GLTF требуют flipY = false
        textures.dvd.colorSpace = THREE.SRGBColorSpace
        textures.dvd.flipY = false

        textures.psu.colorSpace = THREE.SRGBColorSpace
        textures.psu.flipY = false

        textures.io.colorSpace = THREE.SRGBColorSpace
        textures.io.flipY = false

        textures.pcie.colorSpace = THREE.SRGBColorSpace
        textures.pcie.flipY = false

        textures.powerButton.colorSpace = THREE.SRGBColorSpace
        textures.powerButton.flipY = false

        textures.badge.colorSpace = THREE.SRGBColorSpace
        textures.badge.flipY = false

        // 1. Основной металлический корпус (шасси / боковые панели)
        // side: THREE.DoubleSide обязателен из-за отрицательного масштаба нод модели в GLTF
        const caseMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(caseColor),
            roughness: 0.45,
            metalness: 0.35,
            side: THREE.DoubleSide,
        })

        // 2. Лицевая панель DVD-привода SONY (Cube.005 / Cube005)
        const dvdMat = new THREE.MeshStandardMaterial({
            map: textures.dvd,
            roughness: 0.38,
            metalness: 0.2,
            side: THREE.DoubleSide,
        })

        // 3. Блок питания с вентилятором и разъемом питания (Cube.002 / Cube002)
        const psuMat = new THREE.MeshStandardMaterial({
            map: textures.psu,
            roughness: 0.35,
            metalness: 0.65,
            side: THREE.DoubleSide,
        })

        // 4. Панель разъемов материнской платы I/O Shield (Cube.004 / Cube004)
        const ioMat = new THREE.MeshStandardMaterial({
            map: textures.io,
            roughness: 0.3,
            metalness: 0.75,
            side: THREE.DoubleSide,
        })

        // 5. Заглушки слотов расширения PCIe (Cube.003 / Cube003)
        const pcieMat = new THREE.MeshStandardMaterial({
            map: textures.pcie,
            roughness: 0.35,
            metalness: 0.7,
            side: THREE.DoubleSide,
        })

        // 6. Кнопка включения с символом питания (Circle)
        const powerMat = new THREE.MeshStandardMaterial({
            map: textures.powerButton,
            roughness: 0.3,
            metalness: 0.15,
            side: THREE.DoubleSide,
        })

        // 7. Светодиоды индикации на верхней панели
        const hddLedMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#ff2222'),
            emissive: new THREE.Color('#ff1111'),
            emissiveIntensity: 2.8,
            roughness: 0.2,
            side: THREE.DoubleSide,
        })

        const powerLedMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#38bdf8'),
            emissive: new THREE.Color('#0284c7'),
            emissiveIntensity: 2.2,
            roughness: 0.2,
            side: THREE.DoubleSide,
        })

        // 8. Кнопка Reset / доп. переключатель (Cube.001 / Cube001)
        const resetMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#22242a'),
            roughness: 0.5,
            metalness: 0.25,
            side: THREE.DoubleSide,
        })

        // 9. Фирменный шильдик с логотипом 'S' на передней дверце
        const badgeMat = new THREE.MeshStandardMaterial({
            map: textures.badge,
            roughness: 0.25,
            metalness: 0.75,
            side: THREE.DoubleSide,
        })

        return { caseMat, dvdMat, psuMat, ioMat, pcieMat, powerMat, hddLedMat, powerLedMat, resetMat, badgeMat }
    }, [textures, caseColor])

    // Применяем материалы к деталям модели (учитывая санитизацию имен нод в Three.js)
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = castShadow
                mesh.receiveShadow = receiveShadow
                mesh.frustumCulled = false

                // Three.js GLTFLoader удаляет точки из имен нод: 'Cube.005' -> 'Cube005'
                const clean = mesh.name.replace(/[^a-zA-Z0-9]/g, '')

                if (clean === 'Cube005') {
                    mesh.material = materials.dvdMat
                } else if (clean === 'Cube002') {
                    mesh.material = materials.psuMat
                } else if (clean === 'Cube004') {
                    mesh.material = materials.ioMat
                } else if (clean === 'Cube003') {
                    mesh.material = materials.pcieMat
                } else if (clean === 'Circle') {
                    mesh.material = materials.powerMat
                } else if (clean === 'Sphere') {
                    mesh.material = materials.hddLedMat
                } else if (clean === 'Sphere001') {
                    mesh.material = materials.powerLedMat
                } else if (clean === 'Cube001') {
                    mesh.material = materials.resetMat
                } else {
                    mesh.material = materials.caseMat
                }
            }
        })

        // Добавляем фирменный шильдик с логотипом 'S' на переднюю дверцу
        const badgeGeom = new THREE.PlaneGeometry(0.045, 0.045)
        const badgeMesh = new THREE.Mesh(badgeGeom, materials.badgeMat)
        badgeMesh.name = 'FrontBadge'
        badgeMesh.position.set(0.602, 0.58, 0.353)
        badgeMesh.rotation.set(0, Math.PI / 2, 0)
        badgeMesh.castShadow = castShadow
        badgeMesh.receiveShadow = receiveShadow
        scene.add(badgeMesh)

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

useGLTF.preload('/models/Comp.glb')
useTexture.preload('/textures/comp/cdroompng.png')
useTexture.preload('/textures/comp/TexturesCom_Electronics0024_1_M.jpg')
useTexture.preload('/textures/comp/Untiatled.png')
useTexture.preload('/textures/comp/Untaitled.png')
useTexture.preload('/textures/comp/power-symbol-7.png')
useTexture.preload('/textures/comp/letter-s36.jpg')
