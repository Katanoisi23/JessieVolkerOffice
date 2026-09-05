import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CoffeeCupProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    targetHeight?: number
    scale?: number | [number, number, number]
    steamOffset?: [number, number, number]
}

// Шейдер для волнообразной шелковистой ленты пара
const steamVertexShader = `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uCurl;
    varying vec2 vUv;

    void main() {
        vUv = uv;
        vec3 pos = position;
        float h = uv.y;

        float wave1 = sin(h * 9.0 - uTime * uSpeed) * 0.014 * h;
        float wave2 = cos(h * 15.0 - uTime * (uSpeed * 1.3)) * 0.007 * pow(h, 1.4);
        float waveZ = sin(h * 11.0 - uTime * (uSpeed * 0.9)) * 0.008 * h;

        pos.x += (wave1 + wave2) * uCurl;
        pos.z += waveZ * uCurl;
        // Тонкая струйка у самого отверстия (0.3), плавно раскрывающаяся в воздухе
        pos.x *= (0.3 + h * 1.4);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`

const steamFragmentShader = `
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
        float edge = smoothstep(0.0, 0.48, 0.5 - abs(vUv.x - 0.5));
        float fadeIn = smoothstep(0.0, 0.08, vUv.y);
        float fadeOut = smoothstep(1.0, 0.35, vUv.y);
        float verticalFlow = fadeIn * fadeOut;
        float wisp = 0.85 + 0.15 * sin(vUv.y * 22.0 - uTime * 3.0);
        float alpha = edge * verticalFlow * wisp * uOpacity;

        vec3 steamColor = vec3(0.96, 0.97, 0.99);
        gl_FragColor = vec4(steamColor, alpha);
    }
`

function WispySteamRibbon({
    offset = [0, 0, 0],
    height = 0.14,
    width = 0.02,
    speed = 2.4,
    curl = 1.0,
    opacity = 0.45,
    angle = 0,
}: {
    offset?: [number, number, number]
    height?: number
    width?: number
    speed?: number
    curl?: number
    opacity?: number
    angle?: number
}) {
    const matRef = useRef<THREE.ShaderMaterial>(null)

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uSpeed: { value: speed },
            uCurl: { value: curl },
            uOpacity: { value: opacity },
        }),
        [speed, curl, opacity]
    )

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
        }
    })

    return (
        <group position={offset} rotation={[0, angle, 0]}>
            <mesh position={[0, height * 0.5, 0]}>
                <planeGeometry args={[width, height, 16, 64]} />
                <shaderMaterial
                    ref={matRef}
                    vertexShader={steamVertexShader}
                    fragmentShader={steamFragmentShader}
                    uniforms={uniforms}
                    transparent
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    )
}

function RealisticCoffeeSteam({
    cupHeight = 0.1,
    offset = [-0.001, 0.012, 0.037],
}: {
    cupHeight?: number
    offset?: [number, number, number]
}) {
    return (
        <group position={[offset[0], cupHeight + offset[1], offset[2]]}>
            {/* 1. Основная струйка пара прямо из питьевого отверстия */}
            <WispySteamRibbon
                offset={[0, 0, 0]}
                height={0.05}
                width={0.012}
                speed={1.2}
                curl={1.1}
                opacity={0.45}
                angle={0.2}
            />
            {/* Вторая перекрестная плоскость для объема с любого ракурса */}
            <WispySteamRibbon
                offset={[0, 0, 0]}
                height={0.05}
                width={0.020}
                speed={2.2}
                curl={1.1}
                opacity={0.38}
                angle={1.9}
            />

            {/* 2. Тонкий вихревой завиток */}
            <WispySteamRibbon
                offset={[-0.003, 0.003, 0.002]}
                height={0.03}
                width={0.012}
                speed={2.8}
                curl={1.3}
                opacity={0.32}
                angle={-0.5}
            />
        </group>
    )
}

export function CoffeeCup({
    position = [-1.6, 0.91, -2.5],
    rotation = [4.75, 3.15, 1.6],
    targetHeight = 0.11,
    scale = 1,
    steamOffset,
}: CoffeeCupProps) {
    const gltf = useGLTF('/models/coffee.glb')
    const groupRef = useRef<THREE.Group>(null)

    // Загрузка текстур
    const textures = useTexture({
        lidDiffuse: '/textures/coffee/coffee_cup_12oz_couvercle_Diffuse.jpg',
        lidNormal: '/textures/coffee/coffee_cup_12oz_couvercle_Normal.jpg',
        cupDiffuse: '/textures/coffee/coffee_cup_12oz_gobelet_Diffuse.jpg',
        cupNormal: '/textures/coffee/coffee_cup_12oz_gobelet_Normal.jpg',
    })

    // Настройка материалов
    const { lidMaterial, cupMaterial } = useMemo(() => {
        textures.lidDiffuse.colorSpace = THREE.SRGBColorSpace
        textures.cupDiffuse.colorSpace = THREE.SRGBColorSpace

        textures.lidDiffuse.flipY = false
        textures.lidNormal.flipY = false
        textures.cupDiffuse.flipY = false
        textures.cupNormal.flipY = false

        // Принудительно отправляем текстуры в видеопамять (VRAM)
        textures.lidDiffuse.needsUpdate = true
        textures.lidNormal.needsUpdate = true
        textures.cupDiffuse.needsUpdate = true
        textures.cupNormal.needsUpdate = true

        const lidMat = new THREE.MeshStandardMaterial({
            map: textures.lidDiffuse,
            normalMap: textures.lidNormal,
            normalScale: new THREE.Vector2(2.0, 2.0),
            roughness: 0.35,
            metalness: 0.05,
            side: THREE.DoubleSide,
        })

        const cupMat = new THREE.MeshStandardMaterial({
            map: textures.cupDiffuse,
            normalMap: textures.cupNormal,
            normalScale: new THREE.Vector2(1.6, 1.6),
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide,
        })

        return { lidMaterial: lidMat, cupMaterial: cupMat }
    }, [textures])

    // Применяем материалы ДО рендера прямо при клонировании сцены
    const clonedScene = useMemo(() => {
        const scene = gltf.scene.clone(true)

        const meshes: THREE.Mesh[] = []
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.frustumCulled = false
                if (mesh.geometry) mesh.geometry.computeVertexNormals()
                meshes.push(mesh)
            }
        })

        // Функция сопоставления материала крышки или стакана
        const resolveMat = (matName: string, meshName: string) => {
            const combined = `${matName} ${meshName}`.toLowerCase()
            return /couvercle|lid|cap|top/i.test(combined) ? lidMaterial : cupMaterial
        }

        if (meshes.length === 2) {
            const [meshA, meshB] = meshes
            const boxA = new THREE.Box3().setFromObject(meshA)
            const boxB = new THREE.Box3().setFromObject(meshB)

            const heightA = boxA.max.y - boxA.min.y
            const heightB = boxB.max.y - boxB.min.y

            // Крышка всегда ниже/тоньше по высоте, чем стакан
            const lid = heightA < heightB ? meshA : meshB
            const cup = heightA < heightB ? meshB : meshA

            lid.material = lidMaterial
            cup.material = cupMaterial
        } else {
            meshes.forEach((mesh) => {
                if (Array.isArray(mesh.material)) {
                    // Мультиматериал (массив)
                    mesh.material = mesh.material.map((m) => resolveMat(m.name, mesh.name))
                } else {
                    mesh.material = resolveMat(mesh.material?.name || '', mesh.name)
                }
            })
        }

        return scene
    }, [gltf.scene, lidMaterial, cupMaterial])

    // Диагностический вывод в консоль браузера
    useEffect(() => {
        console.log('=== ДИАГНОСТИКА COFFEE.GLB ===')
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                console.log(`☕ Меш: "${mesh.name}" | Материалы:`, mats.map((m) => `"${m.name}"`))
            }
        })
        console.log('==============================')
    }, [clonedScene])

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
        <group position={position} ref={groupRef}>
            {/* Стакан с кофе */}
            <group rotation={rotation} scale={computedScale}>
                <primitive object={clonedScene} />
            </group>

            {/* Изящный волновой пар точно над отверстием стакана */}
            <RealisticCoffeeSteam cupHeight={targetHeight} offset={steamOffset} />
        </group>
    )
}