import * as THREE from 'three'

export function OfficeDoor() {
    // Цвета точно как на фото
    const frameColor = '#3f3a35' // Темные графитово-коричневые наличники
    const doorColor = '#bc8d59' // Карамельно-древесное полотно двери
    const doorEdgeColor = '#d9aa74' // Светлый деревянный торец
    const handleColor = '#211f1e' // Матовая черная ручка
    const stickerColor = '#fef08a' // Желтый стикер

    return (
        <group position={[-0.15, 0, 3.5]}>
            {/* 1. ГЛУБОКАЯ ДВЕРНАЯ КОРОБКА И ШИРОКИЕ НАЛИЧНИКИ */}
            <group>
                {/* Левый наличник */}
                <mesh position={[-0.51, 1.1, -0.01]}>
                    <boxGeometry args={[0.1, 2.24, 0.34]} />
                    <meshStandardMaterial color={frameColor} roughness={0.6} />
                </mesh>
                {/* Правый наличник */}
                <mesh position={[0.51, 1.1, -0.01]}>
                    <boxGeometry args={[0.1, 2.24, 0.34]} />
                    <meshStandardMaterial color={frameColor} roughness={0.6} />
                </mesh>
                {/* Верхний наличник */}
                <mesh position={[0, 2.24, -0.01]}>
                    <boxGeometry args={[1.12, 0.09, 0.34]} />
                    <meshStandardMaterial color={frameColor} roughness={0.6} />
                </mesh>
            </group>

            {/* 2. ПОЛОТНО ДВЕРИ (Петли справа, приоткрыта в комнату как на фото) */}
            <group position={[0.46, 0, 0]} rotation={[0, 0.32, 0]}>
                {/* Основное полотно двери */}
                <mesh position={[-0.46, 1.1, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.92, 2.18, 0.045]} />
                    <meshStandardMaterial color={doorColor} roughness={0.45} />
                </mesh>

                {/* Светлый торец полотна двери (видимый сбоку) */}
                <mesh position={[-0.921, 1.1, 0]}>
                    <boxGeometry args={[0.005, 2.178, 0.044]} />
                    <meshStandardMaterial color={doorEdgeColor} roughness={0.35} />
                </mesh>

                {/* 3. ГОРИЗОНТАЛЬНАЯ ЧЕРНАЯ РУЧКА-ПЛАНКА (Как на фото) */}
                <group position={[-0.8, 1.02, -0.038]}>
                    {/* Сама планка ручки */}
                    <mesh castShadow>
                        <boxGeometry args={[0.18, 0.03, 0.02]} />
                        <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.4} />
                    </mesh>
                    {/* Крепление ручки к двери */}
                    <mesh position={[0.06, 0, 0.015]}>
                        <boxGeometry args={[0.03, 0.02, 0.015]} />
                        <meshStandardMaterial color={handleColor} roughness={0.3} />
                    </mesh>
                    <mesh position={[-0.06, 0, 0.015]}>
                        <boxGeometry args={[0.03, 0.02, 0.015]} />
                        <meshStandardMaterial color={handleColor} roughness={0.3} />
                    </mesh>
                </group>

                {/* 4. ДВЕРНОЙ ГЛАЗОК ПО ЦЕНТРУ */}
                <group position={[-0.46, 1.45, -0.024]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.012, 0.012, 0.005, 24]} />
                        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, 0, -0.003]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.005, 0.005, 0.006, 16]} />
                        <meshBasicMaterial color="#0f172a" />
                    </mesh>
                </group>

                {/* 5. ЖЕЛТЫЙ СТИКЕР (POST-IT NOTE) НА ТОРЦЕ ДВЕРИ */}
                <mesh position={[-0.923, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[0.07, 0.07]} />
                    <meshStandardMaterial color={stickerColor} roughness={0.8} />
                </mesh>
            </group>

            {/* 6. КОРИДОР С ТЕПЛЫМ СВЕТОМ ЗА ДВЕРЬЮ */}
            <group position={[0, 0, 1.3]}>
                {/* Пол коридора */}
                <mesh position={[0, -0.1, 0]}>
                    <boxGeometry args={[1.8, 0.2, 2.6]} />
                    <meshStandardMaterial color="#1a1816" roughness={0.7} />
                </mesh>
                {/* Стена в конце коридора */}
                <mesh position={[0, 2.1, 1.3]}>
                    <boxGeometry args={[1.8, 4.2, 0.3]} />
                    <meshStandardMaterial color="#2d3039" roughness={0.9} />
                </mesh>
                {/* Левая и правая стены коридора */}
                <mesh position={[-0.9, 2.1, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.6, 4.2, 0.3]} />
                    <meshStandardMaterial color="#2d3039" roughness={0.9} />
                </mesh>
                <mesh position={[0.9, 2.1, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.6, 4.2, 0.3]} />
                    <meshStandardMaterial color="#2d3039" roughness={0.9} />
                </mesh>

                {/* Мягкий свет в коридоре, льющийся в щель двери */}
                <pointLight position={[0, 2.4, 0.6]} intensity={1.8} distance={4.5} color="#fef3c7" />
            </group>
        </group>
    )
}