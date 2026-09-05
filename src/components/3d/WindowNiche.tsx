import * as THREE from 'three'
import { CustomModel } from './CustomModel'

export function WindowNiche() {
    const lightWood = '#d8be9b'
    const darkWood = '#b89a74'
    const wallColor = '#eae7df'
    const stepY = 0.12 // Высота подиума

    return (
        <group position={[1.3, 0, -4.5]}>
            {/* 1. НАКЛОННЫЙ СКОС МАНСАРДЫ С ОКНОМ (опущен по высоте: Y = 2.38) */}
            <group position={[0, 2.38, -1.0]} rotation={[Math.PI / 9, 0, 0]}>
                {/* Стены скоса вокруг проема */}
                <mesh position={[-0.95, 0, 0]}>
                    <boxGeometry args={[0.7, 2.8, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[0.95, 0, 0]}>
                    <boxGeometry args={[0.7, 2.8, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.0, 0]}>
                    <boxGeometry args={[1.2, 0.5, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[0, -1.15, 0]}>
                    <boxGeometry args={[1.2, 0.5, 0.2]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* ОКНО В ПРОЕМЕ (полностью закрытое) */}
                <group position={[0, -0.075, -0.02]}>
                    {/* ВНЕШНЯЯ РАМА В СТЕНЕ */}
                    <mesh position={[-0.575, 0, 0.04]}>
                        <boxGeometry args={[0.05, 1.65, 0.16]} />
                        <meshStandardMaterial color={darkWood} roughness={0.4} />
                    </mesh>
                    <mesh position={[0.575, 0, 0.04]}>
                        <boxGeometry args={[0.05, 1.65, 0.16]} />
                        <meshStandardMaterial color={darkWood} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.8, 0.04]}>
                        <boxGeometry args={[1.2, 0.05, 0.16]} />
                        <meshStandardMaterial color={darkWood} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, -0.8, 0.04]}>
                        <boxGeometry args={[1.2, 0.05, 0.18]} />
                        <meshStandardMaterial color={darkWood} roughness={0.4} />
                    </mesh>

                    {/* ЗАКРЫТАЯ СТВОРКА (rotation = [0, 0, 0]) */}
                    <group position={[0, 0, 0.04]}>
                        {/* Рамка створки по периметру */}
                        <mesh position={[-0.51, 0, 0]}>
                            <boxGeometry args={[0.06, 1.51, 0.06]} />
                            <meshStandardMaterial color={lightWood} roughness={0.35} />
                        </mesh>
                        <mesh position={[0.51, 0, 0]}>
                            <boxGeometry args={[0.06, 1.51, 0.06]} />
                            <meshStandardMaterial color={lightWood} roughness={0.35} />
                        </mesh>
                        <mesh position={[0, 0.725, 0]}>
                            <boxGeometry args={[1.08, 0.06, 0.06]} />
                            <meshStandardMaterial color={lightWood} roughness={0.35} />
                        </mesh>
                        <mesh position={[0, -0.725, 0]}>
                            <boxGeometry args={[1.08, 0.06, 0.06]} />
                            <meshStandardMaterial color={lightWood} roughness={0.35} />
                        </mesh>

                        {/* Ручка створки */}
                        <group position={[0, -0.62, 0.04]}>
                            <mesh rotation={[0, 0, Math.PI / 2]}>
                                <cylinderGeometry args={[0.009, 0.009, 0.3, 16]} />
                                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                            </mesh>
                        </group>

                        {/* НЕПРОЗРАЧНОЕ СТЕКЛО (эффект дневного неба) */}
                        <mesh position={[0, 0, 0.01]}>
                            <planeGeometry args={[0.98, 1.41]} />
                            <meshStandardMaterial
                                color="#cce3f5"
                                roughness={0.15}
                                metalness={0.05}
                            />
                        </mesh>
                    </group>
                </group>
            </group>

            {/* 2. БАТАРЕЯ ОТОПЛЕНИЯ */}
            <group position={[-0.2, stepY, -1.35]}>
                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[0.01, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65}
                    color="#f8fafc"
                />
                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[-0.2, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65}
                    color="#f8fafc"
                />
                <CustomModel
                    modelPath="/models/DeltaLaserline.glb"
                    position={[0.44, 0.15, 0]}
                    rotation={[0, 0, 0]}
                    targetHeight={0.65}
                    color="#f8fafc"
                />
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