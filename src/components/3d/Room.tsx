import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { MonitorScreen } from '../Interactive/MonitorScreen'
import { useOfficeStore } from '../../stores/useOfficeStore'

export function Room() {
    const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)
    const toggleRadio = useOfficeStore((state) => state.toggleRadio)

    // 1. Текстуры для пола (Plastered Wall)
    const floorTextures = useTexture({
        map: '/textures/plastered_wall_05_diff_4k.jpg',
        aoMap: '/textures/plastered_wall_05_ao_4k.jpg',
    })

    floorTextures.map.wrapS = floorTextures.map.wrapT = THREE.RepeatWrapping
    floorTextures.map.repeat.set(4, 4)
    floorTextures.aoMap.wrapS = floorTextures.aoMap.wrapT = THREE.RepeatWrapping
    floorTextures.aoMap.repeat.set(4, 4)

    // 2. Текстуры для стен (White Stucco)
    const wallTexture = useTexture('/textures/white_stucco_diff_4k.jpg')
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
    wallTexture.repeat.set(3, 2)

    return (
        <group>
            {/* ПОЛ: объемная плита с толщиной 0.2м для надежной коллизии */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow position={[0, -0.1, 0]}>
                    <boxGeometry args={[12, 0.2, 12]} />
                    <meshStandardMaterial
                        map={floorTextures.map}
                        aoMap={floorTextures.aoMap}
                        aoMapIntensity={1}
                        roughness={0.8}
                    />
                </mesh>
            </RigidBody>

            {/* СТЕНЫ */}
            <RigidBody type="fixed" colliders="cuboid">
                {/* Задняя стена */}
                <mesh position={[0, 2.5, -5]}>
                    <boxGeometry args={[12, 5, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} />
                </mesh>

                {/* Передняя стена */}
                <mesh position={[0, 2.5, 5]}>
                    <boxGeometry args={[12, 5, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} />
                </mesh>

                {/* Левая стена */}
                <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[12, 5, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} />
                </mesh>

                {/* Правая стена */}
                <mesh position={[5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[12, 5, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} />
                </mesh>
            </RigidBody>

            {/* РАБОЧИЙ СТОЛ */}
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0.4, -1.8]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[2.6, 0.8, 1.2]} />
                    <meshStandardMaterial color="#1a1816" roughness={0.6} />
                </mesh>
            </RigidBody>

            {/* МОНИТОР НА СТОЛЕ */}
            <MonitorScreen />

            {/* РАДИО */}
            <mesh
                position={[0.9, 0.95, -1.6]}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleRadio()
                }}
            >
                <boxGeometry args={[0.3, 0.2, 0.15]} />
                <meshStandardMaterial color={isRadioPlaying ? '#10b981' : '#ef4444'} roughness={0.3} />
            </mesh>
        </group>
    )
}