import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { WindowNiche } from './WindowNiche'
import { OfficeDoor } from './OfficeDoor'
import { CustomModel } from './CustomModel'
import { DeskLamp } from './DeskLamp'
import { WallShelf } from './WallShelf'

export function Room() {
    const floorTextures = useTexture({
        map: '/textures/plastered_wall_05_diff_4k.jpg',
        aoMap: '/textures/plastered_wall_05_ao_4k.jpg',
    })
    floorTextures.map.wrapS = floorTextures.map.wrapT = THREE.RepeatWrapping
    floorTextures.map.repeat.set(3, 4)
    floorTextures.aoMap.wrapS = floorTextures.aoMap.wrapT = THREE.RepeatWrapping
    floorTextures.aoMap.repeat.set(3, 4)

    const wallTexture = useTexture('/textures/white_stucco_diff_4k.jpg')
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
    wallTexture.repeat.set(2, 2)

    const darkBaseboardColor = '#151518'

    return (
        <group>
            {/* 1. ОСНОВНОЙ ПОЛ КОМНАТЫ */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow position={[0, -0.1, 0]}>
                    <boxGeometry args={[6.5, 0.2, 7.5]} />
                    <meshStandardMaterial
                        map={floorTextures.map}
                        aoMap={floorTextures.aoMap}
                        aoMapIntensity={1.3}
                        color="#221e1d"
                        roughness={0.6}
                    />
                </mesh>
            </RigidBody>

            {/* 2. ПОДИУМ В НИШЕ (+12 см) */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow position={[1.3, 0.01, -4.75]}>
                    <boxGeometry args={[1.8, 0.22, 2.5]} />
                    <meshStandardMaterial
                        map={floorTextures.map}
                        aoMap={floorTextures.aoMap}
                        aoMapIntensity={1.3}
                        color="#221e1d"
                        roughness={0.6}
                    />
                </mesh>
            </RigidBody>

            {/* Торец и окантовка ступени */}
            <group position={[1.3, 0, -3.5]}>
                <mesh position={[0, 0.06, 0.01]}>
                    <boxGeometry args={[1.8, 0.12, 0.02]} />
                    <meshStandardMaterial color="#1a1a1d" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.122, 0.01]}>
                    <boxGeometry args={[1.8, 0.008, 0.04]} />
                    <meshStandardMaterial color="#b89358" metalness={0.7} roughness={0.3} />
                </mesh>
            </group>

            {/* 3. ПОТОЛОК */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 4.2, -1.0]}>
                    <boxGeometry args={[6.5, 1.5, 11.0]} />
                    <meshStandardMaterial color="#f0efe9" roughness={0.9} />
                </mesh>
            </RigidBody>

            {/* 4. СТЕНЫ С ДВЕРНЫМ ПРОЕМОМ */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[-2.5, 2.1, -0.5]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[8.0, 4.2, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[2.2, 2.1, -1.5]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[10.0, 4.2, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[-1.05, 2.1, -3.5]}>
                    <boxGeometry args={[3.2, 4.2, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[0.4, 2.1, -4.75]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.8, 4.2, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[1.3, 0.7, -6.0]}>
                    <boxGeometry args={[1.8, 1.4, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[-1.575, 2.1, 3.5]}>
                    <boxGeometry args={[1.85, 4.2, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[1.275, 2.1, 3.5]}>
                    <boxGeometry args={[1.85, 4.2, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>

                <mesh position={[-0.15, 3.2, 3.5]}>
                    <boxGeometry args={[1.0, 2.0, 0.3]} />
                    <meshStandardMaterial map={wallTexture} color="#eae8e1" roughness={0.9} />
                </mesh>
            </RigidBody>

            {/* 5. ДВЕРЬ И КОРИДОР */}
            <OfficeDoor />

            {/* 6. ПЕРВЫЙ СТОЛ (WorkCenter.glb) */}
            <CustomModel
                modelPath="/models/WorkCenter.glb"
                position={[-1.25, 0.4, -2]}
                rotation={[Math.PI / 2, 0, 1.56]}
                targetHeight={0.9}
                color="#d8be9b"
            />

            {/* Модель мебели Panel.glb */}
            <CustomModel
                modelPath="/models/Panel.glb"
                position={[0.53, 0.2, -4.5]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, 1.56, 0]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={1.0}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
            />



            {/* 7. НАСТОЛЬНАЯ ЛАМПА НА СТОЛЕ */}
            <DeskLamp
                modelPath="/models/lamp.glb"
                position={[-1.25, 1.95, -2.4]}
                rotation={[1.5, 0, 1]}
                targetHeight={0.45}
                lightColor="#fef08a"
                lightIntensity={3.5}
            />

            {/* 8. НАСТЕННАЯ ДВУХЦВЕТНАЯ ПОЛКА (Увеличена и сдвинута левее) */}
            <WallShelf
                position={[-2.2, 2.15, 1.5]} // 👈 Сдвинута левее вдоль стены (Z = -1.0)
                rotation={[0, Math.PI / 2, 0]}
                scale={1.8}                    // 👈 Увеличен масштаб (в 1.5 раза)
                woodColor="#cda376"
                whiteColor="#ffffff"
            />

            {/* 9. ОФИСНОЕ КРЕСЛО (Chairs.glb) */}
            <CustomModel
                modelPath="/models/Chairs.glb"
                position={[-1.4, 0.65, -2]}
                rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
                targetHeight={0.9}
                color="#1e2229"
                roughness={0.7}
                metalness={0.15}
            />

            {/* 10. ВТОРОЙ СТОЛ (Table.glb) */}
            <CustomModel
                modelPath="/models/Table.glb"
                position={[1.7, 0, -4.5]}
                rotation={[0, -1.58, 0]}
                targetHeight={0.75}
                color="#d8be9b"
            />

            {/* 11. ШКАФ (Rockworth.glb) */}
            <CustomModel
                modelPath="/models/Rockworth.glb"
                position={[1.75, 0, -3]}
                rotation={[0, 4.7, 0]}
                targetHeight={2.2}
                color="#d8be9b"
            />

            {/* 12. МАНСАРДНАЯ НИША */}
            <WindowNiche />

            {/* 13. Крючки Леколар */}

            <CustomModel
                modelPath="/models/Lecolar.glb"
                position={[-1.5, 1.44, 3.3]}  // Поставит объект перед вами в комнате
                rotation={[0, 3.2, 0]}
                targetHeight={0.1}       // Высота 85 см (измените под реальный размер объекта)
            />

            {/* Модель мебели Furniture.glb */}
            <CustomModel
                modelPath="/models/Furniture.glb"
                position={[-2.1, 1.66, 1]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, 0, 0]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={0.3}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
            />

            <CustomModel
                modelPath="/models/Outledt.glb"
                position={[2, 0.75, -1.75]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, -1.65, 1.59]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={0.15}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
            />

            <CustomModel
                modelPath="/models/EVPSVPL.glb"
                position={[-2.2, 1.78, 1.85]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, 0, 0]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={0.15}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
            />

            <CustomModel
                modelPath="/models/Safe.glb"
                texturePath="/textures/safe/safe-lock-markers.png"
                position={[-1.2, 1.28, 1.85]}
                rotation={[0, 0, 0]}
                targetHeight={0.45}
                metalness={0.5}
                roughness={0.35}
            />

            <CustomModel
                modelPath="/models/SM_JewelleryBox01_Body.glb"
                position={[-2.12, 1.665, 1.3]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, 1.55, 0]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={0.055}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
            />

            <CustomModel
                modelPath="/models/SM_JewelleryBox01_Head.glb"
                position={[-2.12, 1.72, 1.3]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, 1.55, 0]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={0.025}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
            />

            {/* 14. ПЛИНТУСЫ */}
            <group>
                <mesh position={[-2.335, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[6.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[-1.51, 0.05, 3.335]}>
                    <boxGeometry args={[1.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[1.275, 0.05, 3.335]}>
                    <boxGeometry args={[1.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[-1.08, 0.05, -3.335]}>
                    <boxGeometry args={[3.26, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[2.035, 0.05, 0.15]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[7.3, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[2.035, 0.17, -4.75]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.5, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[0.565, 0.17, -4.75]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.5, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[1.3, 0.17, -5.835]}>
                    <boxGeometry args={[1.5, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                {/* Кабель-канал */}
                <mesh position={[-2.33, 0.9, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[6.7, 0.04, 0.02]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.4} />
                </mesh>
            </group>
        </group>
    )
}




//  {/* 6. НОВАЯ 3D-МОДЕЛЬ СТОЛА WORKCENTER */}
//             <CustomModel
//                 modelPath="/models/WorkCenter.glb"
//                 position={[-1.45, 0.4, -2]}
//                 rotation={[Math.PI / 2, 0, 1.56]} // 👈 -Math.PI / 2 по оси X ставит стол на ножки
//                 targetHeight={0.75}
//                 color="#d8be9b"
//             />