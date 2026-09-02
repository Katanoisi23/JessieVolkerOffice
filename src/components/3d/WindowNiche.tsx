import * as THREE from 'three'
import { CustomModel } from './CustomModel'

export function WindowNiche() {
    const lightWood = '#d8be9b'
    const wallColor = '#eae7df'
    const stepY = 0.12 // Высота подиума

    return (
        <group position={[1.3, 0, -4.5]}>
            {/* 1. НАКЛОННЫЙ СКОС МАНСАРДЫ С ОКНОМ */}
            <group position={[0, 2.7, -1.0]} rotation={[Math.PI / 4.2, 0, 0]}>
                <mesh position={[-0.95, 0, 0]}>
                    <boxGeometry args={[0.7, 2.8, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[0.95, 0, 0]}>
                    <boxGeometry args={[0.7, 2.8, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                <mesh position={[0, 1.15, 0]}>
                    <boxGeometry args={[1.2, 0.5, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[0, -1.15, 0]}>
                    <boxGeometry args={[1.2, 0.5, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Окно */}
                <group position={[0, 0, -0.05]}>
                    <mesh position={[-0.58, 0, 0.05]}>
                        <boxGeometry args={[0.04, 1.6, 0.16]} />
                        <meshStandardMaterial color={lightWood} roughness={0.4} />
                    </mesh>
                    <mesh position={[0.58, 0, 0.05]}>
                        <boxGeometry args={[0.04, 1.6, 0.16]} />
                        <meshStandardMaterial color={lightWood} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.78, 0.05]}>
                        <boxGeometry args={[1.2, 0.04, 0.16]} />
                        <meshStandardMaterial color={lightWood} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, -0.78, 0.05]}>
                        <boxGeometry args={[1.2, 0.04, 0.16]} />
                        <meshStandardMaterial color={lightWood} roughness={0.4} />
                    </mesh>

                    <mesh position={[0, 0, 0.02]}>
                        <boxGeometry args={[1.1, 1.5, 0.04]} />
                        <meshStandardMaterial color={lightWood} roughness={0.4} />
                    </mesh>

                    <group position={[0, -0.68, 0.06]}>
                        <mesh rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.008, 0.008, 0.24, 16]} />
                            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                        </mesh>
                    </group>

                    <mesh position={[0, 0, 0.01]}>
                        <planeGeometry args={[1.02, 1.4]} />
                        <meshPhysicalMaterial
                            color="#dbeafe"
                            transparent
                            opacity={0.3}
                            roughness={0.05}
                            transmission={0.9}
                            thickness={0.02}
                            reflectivity={0.9}
                        />
                    </mesh>

                    <mesh position={[0, 0, -0.02]}>
                        <planeGeometry args={[1.02, 1.4]} />
                        <meshBasicMaterial color="#bae6fd" />
                    </mesh>
                </group>
            </group>

            {/* 2. НОВАЯ СДВОЕННАЯ БАТАРЕЯ (ДВЕ ПОЛОВИНЫ ВСТЫК ПОД ОКНОМ) */}
            <group position={[-0.2, stepY, -1.35]}>
                {/* Левая половина батареи */}
                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[0.01, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65} // Высота батареи 65 см
                    color="#f8fafc"
                />

                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[-0.2, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65} // Высота батареи 65 см
                    color="#f8fafc"
                />

                {/* Правая половина батареи (состыкована вплотную) */}
                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[0.44, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65}
                    color="#f8fafc"
                />

                {/* Правая половина батареи (состыкована вплотную) */}
                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[0.225, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65}
                    color="#f8fafc"
                />

                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[0.65, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65}
                    color="#f8fafc"
                />
            </group>
        </group>
    )
}