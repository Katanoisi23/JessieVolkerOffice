import { RigidBody } from '@react-three/rapier'

interface WorkstationProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
}

export function Workstation({ position = [0, 0, 0], rotation = [0, 0, 0] }: WorkstationProps) {
    const deskWood = '#d9ceb9' // Светлое дерево стола

    return (
        <group position={position} rotation={rotation}>
            {/* 1. СТОЛЕШНИЦА (С физическим коллайдером) */}
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0.75, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[2.1, 0.05, 0.9]} />
                    <meshStandardMaterial color={deskWood} roughness={0.4} />
                </mesh>
            </RigidBody>

            {/* 2. БОКОВИНЫ И ЦАРГА СТОЛА */}
            <group>
                {/* Левая боковина */}
                <mesh position={[-2.0, 0.36, 0]} castShadow>
                    <boxGeometry args={[0.05, 0.72, 0.86]} />
                    <meshStandardMaterial color={deskWood} roughness={0.5} />
                </mesh>
                {/* Правая боковина */}
                <mesh position={[1.0, 0.36, 0]} castShadow>
                    <boxGeometry args={[0.05, 0.72, 0.86]} />
                    <meshStandardMaterial color={deskWood} roughness={0.5} />
                </mesh>
                {/* Задняя панель (царга) */}
                <mesh position={[0, 0.45, -0.38]} castShadow>
                    <boxGeometry args={[1.95, 0.45, 0.03]} />
                    <meshStandardMaterial color={deskWood} roughness={0.5} />
                </mesh>
            </group>

            {/* 3. СИСТЕМНЫЙ БЛОК ПОД СТОЛОМ */}
            <mesh position={[-0.75, 0.22, 0.1]} castShadow>
                <boxGeometry args={[0.22, 0.44, 0.46]} />
                <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* 4. ОФИСНОЕ КРЕСЛО */}
            <group position={[0, 0, 0.65]}>
                {/* Сиденье */}
                <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.54, 0.09, 0.52]} />
                    <meshStandardMaterial color="#475569" roughness={0.7} />
                </mesh>
                {/* Высокая спинка */}
                <mesh position={[0, 0.85, 0.24]} rotation={[-0.08, 0, 0]} castShadow>
                    <boxGeometry args={[0.48, 0.65, 0.06]} />
                    <meshStandardMaterial color="#334155" roughness={0.7} />
                </mesh>
                {/* Подголовник */}
                <mesh position={[0, 1.25, 0.27]} castShadow>
                    <boxGeometry args={[0.3, 0.14, 0.08]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                {/* Подлокотники */}
                <mesh position={[-0.28, 0.66, 0.04]} castShadow>
                    <boxGeometry args={[0.06, 0.03, 0.28]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.4} />
                </mesh>
                <mesh position={[0.28, 0.66, 0.04]} castShadow>
                    <boxGeometry args={[0.06, 0.03, 0.28]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.4} />
                </mesh>
                {/* Газлифт */}
                <mesh position={[0, 0.24, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.44, 16]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Колесики (крестовина) */}
                <group position={[0, 0.05, 0]}>
                    {[0, 72, 144, 216, 288].map((angle, idx) => (
                        <mesh key={idx} rotation={[0, (angle * Math.PI) / 180, 0]}>
                            <boxGeometry args={[0.04, 0.03, 0.56]} />
                            <meshStandardMaterial color="#0f172a" metalness={0.8} />
                        </mesh>
                    ))}
                </group>
            </group>
        </group>
    )
}
// 0.03, 0.03, 0.42, 20

// [0.003, 0.003, 0.08, 16]
// 0.015, 0.015, 0.04, 16