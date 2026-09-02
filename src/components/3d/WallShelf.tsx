import * as THREE from 'three'

interface WallShelfProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
    scale?: number | [number, number, number]
    woodColor?: string
    whiteColor?: string
}

export function WallShelf({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    woodColor = '#cda376',  // Натуральный светлый дуб
    whiteColor = '#ffffff', // Матовый белый
}: WallShelfProps) {
    const panelDepth = 0.22 // Глубина полок (22 см)
    const T = 0.02          // Толщина панелей (2 см)

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* ========================================================= */}
            {/* 1. ВЕРХНИЙ ЛЕВЫЙ ДЕРЕВЯННЫЙ КВАДРАТНЫЙ БЛОК (Светлый дуб)  */}
            {/* ========================================================= */}
            <group position={[-0.32, 0.16, 0]}>
                {/* Верхняя панель */}
                <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.36, T, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
                {/* Нижняя панель */}
                <mesh position={[0, -0.17, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.36, T, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
                {/* Левая боковина */}
                <mesh position={[-0.17, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[T, 0.32, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
                {/* Правая боковина */}
                <mesh position={[0.17, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[T, 0.32, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
            </group>

            {/* ========================================================= */}
            {/* 2. НИЖНИЙ ПРАВЫЙ ДЕРЕВЯННЫЙ ПРЯМОУГОЛЬНИК (Светлый дуб)    */}
            {/* ========================================================= */}
            <group position={[0.24, -0.16, 0]}>
                {/* Верхняя панель */}
                <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.5, T, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
                {/* Нижняя панель */}
                <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.5, T, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
                {/* Левая боковина */}
                <mesh position={[-0.24, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[T, 0.22, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
                {/* Правая боковина */}
                <mesh position={[0.24, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[T, 0.22, panelDepth]} />
                    <meshStandardMaterial color={woodColor} roughness={0.45} />
                </mesh>
            </group>

            {/* ========================================================= */}
            {/* 3. БЕЛЫЕ СОЕДИНИТЕЛЬНЫЕ ПОЛКИ И СТУПЕНИ (Матовый белый)     */}
            {/* ========================================================= */}
            <group>
                {/* Верхняя белая длинная полка */}
                <mesh position={[0.16, 0.23, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.6, T, panelDepth]} />
                    <meshStandardMaterial color={whiteColor} roughness={0.8} />
                </mesh>
                {/* Правая белая вертикальная стойка */}
                <mesh position={[0.45, 0.09, 0]} castShadow receiveShadow>
                    <boxGeometry args={[T, 0.26, panelDepth]} />
                    <meshStandardMaterial color={whiteColor} roughness={0.8} />
                </mesh>

                {/* Нижняя белая полка */}
                <mesh position={[-0.19, -0.21, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.38, T, panelDepth]} />
                    <meshStandardMaterial color={whiteColor} roughness={0.8} />
                </mesh>
                {/* Левая белая вертикальная стойка */}
                <mesh position={[-0.37, -0.11, 0]} castShadow receiveShadow>
                    <boxGeometry args={[T, 0.18, panelDepth]} />
                    <meshStandardMaterial color={whiteColor} roughness={0.8} />
                </mesh>

                {/* Белая задняя стенка в центральной нише */}
                <mesh position={[0.16, 0.09, -0.1]}>
                    <boxGeometry args={[0.58, 0.26, 0.01]} />
                    <meshStandardMaterial color={whiteColor} roughness={0.9} />
                </mesh>
                <mesh position={[-0.19, -0.11, -0.1]}>
                    <boxGeometry args={[0.36, 0.18, 0.01]} />
                    <meshStandardMaterial color={whiteColor} roughness={0.9} />
                </mesh>
            </group>
        </group>
    )
}