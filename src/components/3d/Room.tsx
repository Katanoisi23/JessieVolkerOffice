import { RigidBody } from '@react-three/rapier'
import { MonitorScreen } from '../Interactive/MonitorScreen'
import { useOfficeStore } from '../../stores/useOfficeStore'

export function Room() {
    const isRadioPlaying = useOfficeStore((state) => state.isRadioPlaying)
    const toggleRadio = useOfficeStore((state) => state.toggleRadio)

    return (
        <group>
            {/* Пол (с коллизией) */}
            <RigidBody type="fixed">
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color="#17191e" roughness={0.8} />
                </mesh>
            </RigidBody>

            {/* Стены */}
            <RigidBody type="fixed">
                {/* Задняя стена */}
                <mesh position={[0, 2.5, -5]}>
                    <boxGeometry args={[10, 5, 0.2]} />
                    <meshStandardMaterial color="#21242b" />
                </mesh>
                {/* Передняя стена */}
                <mesh position={[0, 2.5, 5]}>
                    <boxGeometry args={[10, 5, 0.2]} />
                    <meshStandardMaterial color="#21242b" />
                </mesh>
                {/* Левая стена */}
                <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[10, 5, 0.2]} />
                    <meshStandardMaterial color="#1a1c22" />
                </mesh>
                {/* Правая стена */}
                <mesh position={[5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[10, 5, 0.2]} />
                    <meshStandardMaterial color="#1a1c22" />
                </mesh>
            </RigidBody>

            {/* Рабочий стол */}
            <RigidBody type="fixed" position={[0, 0.4, -2]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[2.5, 0.8, 1]} />
                    <meshStandardMaterial color="#2a221b" roughness={0.6} />
                </mesh>
            </RigidBody>

            {/* Интерактивный монитор */}
            <MonitorScreen />

            {/* Интерактивное радио на столе */}
            <mesh
                position={[0.9, 0.9, -1.8]}
                onClick={(e) => {
                    e.stopPropagation()
                    toggleRadio()
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
                <boxGeometry args={[0.3, 0.2, 0.15]} />
                <meshStandardMaterial color={isRadioPlaying ? '#10b981' : '#ef4444'} roughness={0.3} />
            </mesh>
        </group>
    )
}