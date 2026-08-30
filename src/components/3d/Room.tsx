import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { MonitorScreen } from '../Interactive/MonitorScreen'
import { useOfficeStore } from '../../stores/useOfficeStore'

export function Room() {
    const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)
    const toggleRadio = useOfficeStore((state) => state.toggleRadio)

    // Текстуры пола
    const floorTextures = useTexture({
        map: '/textures/plastered_wall_05_diff_4k.jpg',
        aoMap: '/textures/plastered_wall_05_ao_4k.jpg',
    })
    floorTextures.map.wrapS = floorTextures.map.wrapT = THREE.RepeatWrapping
    floorTextures.map.repeat.set(4, 4)
    floorTextures.aoMap.wrapS = floorTextures.aoMap.wrapT = THREE.RepeatWrapping
    floorTextures.aoMap.repeat.set(4, 4)

    // Текстура стен
    const wallTexture = useTexture('/textures/white_stucco_diff_4k.jpg')
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
    wallTexture.repeat.set(3, 2)

    return (
        <group>
            {/* 1. ПОЛ */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow position={[0, -0.1, 0]}>
                    <boxGeometry args={[12, 0.2, 12]} />
                    <meshStandardMaterial
                        map={floorTextures.map}
                        aoMap={floorTextures.aoMap}
                        aoMapIntensity={1.2}
                        roughness={0.75}
                    />
                </mesh>
            </RigidBody>

            {/* 2. ПОТОЛОК */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 4.5, 0]}>
                    <boxGeometry args={[12, 0.2, 12]} />
                    <meshStandardMaterial color="#14161b" roughness={0.9} />
                </mesh>
            </RigidBody>

            {/* 3. СТЕНЫ */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 2.2, -5]}>
                    <boxGeometry args={[12, 4.4, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} color="#e5e5e5" />
                </mesh>
                <mesh position={[0, 2.2, 5]}>
                    <boxGeometry args={[12, 4.4, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} color="#e5e5e5" />
                </mesh>
                <mesh position={[-5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[12, 4.4, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} color="#e5e5e5" />
                </mesh>
                <mesh position={[5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[12, 4.4, 0.4]} />
                    <meshStandardMaterial map={wallTexture} roughness={0.9} color="#e5e5e5" />
                </mesh>
            </RigidBody>

            {/* 4. ПЛИНТУСЫ ПО ПЕРИМЕТРУ */}
            <group position={[0, 0.06, 0]}>
                <mesh position={[0, 0, -4.75]}>
                    <boxGeometry args={[10, 0.12, 0.05]} />
                    <meshStandardMaterial color="#111215" roughness={0.5} />
                </mesh>
                <mesh position={[-4.75, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[10, 0.12, 0.05]} />
                    <meshStandardMaterial color="#111215" roughness={0.5} />
                </mesh>
                <mesh position={[4.75, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[10, 0.12, 0.05]} />
                    <meshStandardMaterial color="#111215" roughness={0.5} />
                </mesh>
            </group>

            {/* 5. КОВЕР ПОД СТОЛОМ */}
            <mesh position={[0, 0.005, -1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[4, 3.2]} />
                <meshStandardMaterial color="#1a1c23" roughness={0.95} />
            </mesh>

            {/* 6. РАБОЧИЙ СТОЛ */}
            <group position={[0, 0, -1.8]}>
                <RigidBody type="fixed" colliders="cuboid" position={[0, 0.75, 0]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[2.6, 0.06, 1.2]} />
                        <meshStandardMaterial color="#211d1a" roughness={0.4} metalness={0.1} />
                    </mesh>
                </RigidBody>

                <mesh position={[-1.2, 0.36, -0.5]} castShadow>
                    <boxGeometry args={[0.06, 0.72, 0.06]} />
                    <meshStandardMaterial color="#0d0e11" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[1.2, 0.36, -0.5]} castShadow>
                    <boxGeometry args={[0.06, 0.72, 0.06]} />
                    <meshStandardMaterial color="#0d0e11" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[-1.2, 0.36, 0.5]} castShadow>
                    <boxGeometry args={[0.06, 0.72, 0.06]} />
                    <meshStandardMaterial color="#0d0e11" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[1.2, 0.36, 0.5]} castShadow>
                    <boxGeometry args={[0.06, 0.72, 0.06]} />
                    <meshStandardMaterial color="#0d0e11" metalness={0.8} roughness={0.3} />
                </mesh>

                <mesh position={[0, 0.785, 0.1]} receiveShadow>
                    <boxGeometry args={[1.2, 0.005, 0.45]} />
                    <meshStandardMaterial color="#15171c" roughness={0.9} />
                </mesh>
            </group>

            {/* 7. ИНТЕРАКТИВНЫЙ МОНИТОР */}
            <group position={[0, 1.35, -1.8]}>
                <MonitorScreen />
                <pointLight position={[0, 0, -0.15]} intensity={3} distance={2.5} color="#38bdf8" />
            </group>

            {/* 8. НАСТЕННАЯ ПОЛКА С ДЕКОРОМ */}
            <group position={[0, 2.6, -4.75]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[3.2, 0.06, 0.35]} />
                    <meshStandardMaterial color="#211d1a" roughness={0.5} />
                </mesh>
                <mesh position={[-0.8, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.2, 0.34, 0.25]} />
                    <meshStandardMaterial color="#3b82f6" roughness={0.6} />
                </mesh>
                <mesh position={[-0.55, 0.18, 0]} castShadow>
                    <boxGeometry args={[0.15, 0.3, 0.25]} />
                    <meshStandardMaterial color="#10b981" roughness={0.6} />
                </mesh>
                <mesh position={[0.7, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.25, 0.24, 0.25]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.4} />
                </mesh>
            </group>

            {/* 9. РЕТРО-РАДИО */}
            <group position={[0.95, 0.88, -1.6]}>
                <mesh
                    castShadow
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleRadio()
                    }}
                >
                    <boxGeometry args={[0.28, 0.18, 0.14]} />
                    <meshStandardMaterial color="#2d2218" roughness={0.4} />
                </mesh>
                <mesh position={[0.08, 0.04, 0.075]}>
                    <sphereGeometry args={[0.015, 16, 16]} />
                    <meshBasicMaterial color={isRadioPlaying ? '#22c55e' : '#ef4444'} />
                </mesh>
            </group>
        </group>
    )
}