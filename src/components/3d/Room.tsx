import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { WindowNiche } from './WindowNiche'
import { OfficeDoor } from './OfficeDoor'
import { CustomModel } from './CustomModel'
import { DeskLamp } from './DeskLamp'
import { WallShelf } from './WallShelf'
import { Books } from './Books'
import { JewelleryBox } from './JewelleryBox'
import { ElectricKettle } from './ElectricKettle'
import { Books2 } from './Books2'
import { Trashcan } from './Trashcan'
import { PencilCup } from './PencilCup'
import { CoffeeCup } from './CoffeeCup'
import { WhiteBoard } from './WhiteBoard'
import { BeanBag } from './BeanBag'

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

    const darkBaseboardColor = '#d2d2d2ff'
    const darkBaseboardColor2 = '#d2d2d2ff'
    const ceilingBaseboardY = 3.40 // 👈 Стык с потолком (3.45 - 0.1/2)

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
                position={[-2.2, 2.15, 1.5]}
                rotation={[0, Math.PI / 2, 0]}
                scale={1.8}
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

            <CustomModel
                modelPath="/models/Monitor.glb"
                position={[-2.1, 1.16, -2]}  // Поставит объект перед вами в комнате
                rotation={[4.72, 3.2, 1.62]}
                targetHeight={0.6}       // Высота 85 см (измените под реальный размер объекта)
            />

            <CustomModel
                modelPath="/models/Mouse.glb"
                position={[-1.5, 0.85, -2.3]}  // Поставит объект перед вами в комнате
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.035}       // Высота 85 см (измените под реальный размер объекта)
            />

            {/* СТАКАНЧИК С КОФЕ */}
            <CoffeeCup
                position={[-1.6, 0.86, -2.5]}
                rotation={[4.75, 3.15, 1.6]}
                targetHeight={0.11}
            />


            <CustomModel
                modelPath="/models/paper1.glb"
                texturePath="/textures/paper/paper.jpeg"
                position={[1.55, 0.79, -4.82]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.0125}
                roughness={0.9}
            />
            <Trashcan
                position={[-2, 0, -1.3]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.3}
            />

            <CustomModel
                modelPath="/models/paper2.glb"
                texturePath="/textures/paper/paper.jpeg"
                position={[1.4, 0.82, -5.35]}
                rotation={[1.45, 1.6, 1.5]}
                targetHeight={0.07}
                roughness={0.9}
            />

            <PencilCup
                position={[-1.9, 0.85, -0.99]}
                rotation={[0, 0, 0]}
                targetHeight={0.15}
            />

            <CustomModel
                modelPath="/models/paper3.glb"
                texturePath="/textures/paper/paper.jpeg"
                position={[1.58, 0.78, -5.3]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.02}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Paper_Stack1.glb"
                texturePath="/textures/paper_Stack/PaperStack_tex512.png"
                position={[1.56, 0.78, -5.06]}
                rotation={[1.4, -1.55, 1.4]}
                targetHeight={0.0175}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Paper_Stack2.glb"
                texturePath="/textures/paper_Stack/PaperStack_tex512.png"
                position={[1.9, 0.78, -5.05]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.05}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Paper_Stack3.glb"
                texturePath="/textures/paper_Stack/PaperStack_tex512.png"
                position={[1.9, 0.78, -5.3]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.2}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Speaker.glb"
                position={[-2.2, 0.81, -2.7]}  // Поставит объект перед вами в комнате
                rotation={[0, 1.6, 0]}
                targetHeight={0.35}       // Высота 85 см (измените под реальный размер объекта)
            />
            <ElectricKettle
                position={[1.8, 0.77, -4]}
                rotation={[0, 1.6, 0]}
                targetHeight={0.35}
            />

            {/* ВТОРОЙ НАБОР КНИГ С PBR-ТЕКСТУРАМИ */}
            <Books2
                position={[1.8, 0.9, -3.25]}
                rotation={[0, -1.6, 0]}
                targetHeight={0.3}
            />



            <CustomModel
                modelPath="/models/Speaker.glb"
                position={[-2.2, 0.81, -1.3]}  // Поставит объект перед вами в комнате
                rotation={[0, 1.6, 0]}
                targetHeight={0.35}       // Высота 85 см (измените под реальный размер объекта)
            />

            <CustomModel
                modelPath="/models/Lmp.glb"
                position={[-2.05, 0.86, -1.05]}
                rotation={[0, 0, 0]}
                targetHeight={0.35}
            />

            {/* МАРКЕРНАЯ ДОСКА С PBR-ТЕКСТУРАМИ */}
            <WhiteBoard
                position={[1.7, 0, 0.25]}
                rotation={[0, 1.56, 0]}
                targetHeight={1.75}
            />

            <CustomModel
                modelPath="/models/MechKeyboard1.glb"
                position={[-1.5, 0.85, -1.95]}
                rotation={[4.72, 1.6, 1.55]}
                targetHeight={0.05}
            />

            {/* Модель мебели Furniture.glb */}
            <CustomModel
                modelPath="/models/Furniture.glb"
                position={[-2.1, 1.66, 1]}
                rotation={[0, 0, 0]}
                targetHeight={0.3}
            />

            <CustomModel
                modelPath="/models/Outledt.glb"
                position={[2, 0.75, -1.75]}
                rotation={[0, -1.65, 1.59]}
                targetHeight={0.15}
            />

            <CustomModel
                modelPath="/models/EVPSVPL.glb"
                position={[-2.2, 1.78, 1.85]}
                rotation={[0, 0, 0]}
                targetHeight={0.15}
                color="#111111"
                buttonColor="#f8fafc"
            />

            {/* КРЕСЛА-МЕШКИ С PBR-ТЕКСТУРАМИ */}
            <BeanBag
                position={[-1.5, 0, 2.6]}
                rotation={[0, 2, 0]}
                targetHeight={1.15}
            />
            <BeanBag
                position={[-1.5, 0, 1.1]}
                rotation={[0, 1, 0]}
                targetHeight={1.15}
            />

            <CustomModel
                modelPath="/models/Сlutch.glb"
                position={[-2.1, 2.22, 2.05]}
                rotation={[-1.55, 0, 1.6]}
                targetHeight={0.1}
            />

            <Books
                position={[-2.12, 2.08, 0.9]}
                rotation={[0, -1.6, 0]}
                targetHeight={0.25}
            />

            <CustomModel
                modelPath="/models/safe.glb"
                texturePath="/textures/safe/safe.jpg"
                position={[1.8, 1.38, -3.2]}
                rotation={[-1.56, 0, 0]}
                targetHeight={0.2}
                metalness={0.6}
                roughness={0.4}
            />

            <JewelleryBox
                position={[-2.12, 1.665, 1.3]}
                rotation={[0, 1.55, 0]}
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

            {/* 15. ПОТОЛОЧНЫЕ ПЛИНТУСЫ (КАРНИЗ) */}
            <group>
                {/* Левая стена */}
                <mesh position={[-2.335, ceilingBaseboardY, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[6.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Передняя стена слева от двери */}
                <mesh position={[-1.51, ceilingBaseboardY, 3.335]}>
                    <boxGeometry args={[1.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Передняя стена над дверным проемом */}
                <mesh position={[-0.12, ceilingBaseboardY, 3.335]}>
                    <boxGeometry args={[1.1, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Передняя стена справа от двери */}
                <mesh position={[1.275, ceilingBaseboardY, 3.335]}>
                    <boxGeometry args={[1.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Задняя стена слева от ниши */}
                <mesh position={[-1.08, ceilingBaseboardY, -3.335]}>
                    <boxGeometry args={[3.26, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Правая стена */}
                <mesh position={[2.035, ceilingBaseboardY, 0.15]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[7.3, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Ниша справа */}
                <mesh position={[2.035, ceilingBaseboardY, -4.75]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.5, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Ниша слева */}
                <mesh position={[0.565, ceilingBaseboardY, -4.75]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[2.5, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>

                {/* Задняя стена ниши */}
                <mesh position={[1.3, ceilingBaseboardY, -5.835]}>
                    <boxGeometry args={[1.5, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor2} roughness={0.5} />
                </mesh>
            </group>
        </group>
    )
}