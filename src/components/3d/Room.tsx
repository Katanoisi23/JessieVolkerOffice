import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
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
import { Mouse } from './Mouse'
import { Vase } from './Vase'
import { Bag } from './Bag'
import { WorkCenter } from './WorkCenter'
import { Speaker } from './Speakers'
import { CoatTree } from './CoatTree'
import { Table } from './Table'
import { Lmp } from './Lmp'
import { Keyboard } from './Keyboard'
import { Bookcase } from './Bookcase'
import { PhotoFrame } from './PhotoFrame'
import { LightSwitch } from './LightSwitch'
import { Computer } from './Computer'
import { ShoeRack } from './ShoeRack'
import { FloorMat } from './FloorMat'
import { Slippers } from './Slippers'
import { ProjectorScreen } from './ProjectorScreen'
import { Projector } from './Projector'
import { WorkstationMonitor } from './WorkstationMonitor'
import { Radio } from './Radio'


export function Room() {
    // Текстура синего офисного ковролина в рубчик
    const carpetTexture = useTexture('/textures/58.jpg')
    carpetTexture.colorSpace = THREE.SRGBColorSpace
    carpetTexture.wrapS = carpetTexture.wrapT = THREE.RepeatWrapping
    carpetTexture.repeat.set(8, 10)

    // Пропорциональный масштаб ковролина для подиума
    const podiumCarpetTexture = useMemo(() => {
        const t = carpetTexture.clone()
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(2.4, 3.3)
        t.needsUpdate = true
        return t
    }, [carpetTexture])

    const wallTexture = useTexture('/textures/white_stucco_diff_4k.jpg')
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
    wallTexture.repeat.set(2, 2)

    const darkBaseboardColor = '#d2d2d2ff'
    const darkBaseboardColor2 = '#d2d2d2ff'
    const ceilingBaseboardY = 3.40 // 👈 Стык с потолком (3.45 - 0.1/2)

    return (
        <group>
            {/* 1. ОСНОВНОЙ ПОЛ КОМНАТЫ С СИНИМ КОВРОЛИНОМ */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow position={[0, -0.1, 0]}>
                    <boxGeometry args={[6.5, 0.2, 7.5]} />
                    <meshStandardMaterial
                        map={carpetTexture}
                        roughness={0.85}
                        metalness={0.0}
                    />
                </mesh>
            </RigidBody>

            {/* 2. ПОДИУМ В НИШЕ (+12 см) */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow position={[1.3, 0.01, -4.75]}>
                    <boxGeometry args={[1.8, 0.22, 2.5]} />
                    <meshStandardMaterial
                        map={podiumCarpetTexture}
                        roughness={0.85}
                        metalness={0.0}
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

            {/* 4.1. ФИЗИЧЕСКИЕ КОЛЛАЙДЕРЫ МЕБЕЛИ И МОДЕЛЕЙ (нельзя пройти сквозь них) */}
            <RigidBody type="fixed" colliders={false}>
                {/* 1. Главный рабочий стол (WorkCenter) */}
                <CuboidCollider args={[0.65, 0.5, 1.05]} position={[-1.75, 0.5, -2.0]} />

                {/* 2. Офисное кресло у стола */}
                <CuboidCollider args={[0.34, 0.45, 0.34]} position={[-1.38, 0.45, -2.0]} />

                {/* 3. Системный блок на полу под столом */}
                <CuboidCollider args={[0.18, 0.3, 0.28]} position={[-1.9, 0.3, -3.0]} />

                {/* 4. Мусорная корзина на полу */}
                <CuboidCollider args={[0.18, 0.2, 0.18]} position={[-2.0, 0.2, -1.5]} />

                {/* 5. Белый скандинавский стол в нише (полное перекрытие от переднего края с чайником до стены) */}
                <CuboidCollider args={[0.68, 0.45, 1.02]} position={[1.38, 0.45, -4.85]} />

                {/* 5.1. Батарея отопления в глубине ниши под окном */}
                <CuboidCollider args={[0.55, 0.4, 0.15]} position={[1.1, 0.45, -5.8]} />

                {/* 6. Боковая перегородка ниши (Panel) */}
                <CuboidCollider args={[0.08, 0.55, 0.55]} position={[0.53, 0.55, -4.5]} />

                {/* 7. Высокий шкаф (Bookcase) */}
                <CuboidCollider args={[0.3, 1.1, 0.58]} position={[1.75, 1.1, -3.0]} />

                {/* 8. Маркерная доска с проектами (WhiteBoard) */}
                <CuboidCollider args={[0.2, 0.88, 0.75]} position={[1.85, 0.88, -0.7]} />

                {/* 9. Кресла-мешки (BeanBag) */}
                <CuboidCollider args={[0.48, 0.55, 0.48]} position={[-1.5, 0.55, 2.6]} />
                <CuboidCollider args={[0.48, 0.55, 0.48]} position={[-1.5, 0.55, 1.1]} />

                {/* 10. Обувница у входа */}
                <CuboidCollider args={[0.42, 0.25, 0.22]} position={[1.0, 0.25, 3.1]} />

                {/* 11. Напольная вешалка */}
                <CuboidCollider args={[0.22, 1.0, 0.22]} position={[1.6, 1.0, 2.9]} />

                {/* 12. Верхнее остекление и мансардный скос ниши */}
                <CuboidCollider args={[0.9, 1.2, 0.2]} position={[1.3, 2.1, -5.85]} />

                {/* 13. Створка открытой двери */}
                <CuboidCollider
                    args={[0.46, 1.1, 0.03]}
                    position={[-0.126, 1.1, 3.64]}
                    rotation={[0, 0.32, 0]}
                />

                {/* 14. Стены и пол внешнего коридора за дверью */}
                <CuboidCollider args={[0.9, 0.1, 1.3]} position={[-0.15, -0.1, 4.8]} />
                <CuboidCollider args={[0.9, 2.1, 0.15]} position={[-0.15, 2.1, 6.1]} />
                <CuboidCollider args={[0.15, 2.1, 1.3]} position={[-1.05, 2.1, 4.8]} />
                <CuboidCollider args={[0.15, 2.1, 1.3]} position={[0.75, 2.1, 4.8]} />
            </RigidBody>

            {/* 5. ДВЕРЬ И КОРИДОР */}
            <OfficeDoor />

            {/* 6. ПЕРВЫЙ СТОЛ (WorkCenter.glb) */}
            <WorkCenter
                position={[-1.75, 1, -2]}
                rotation={[0, Math.PI / 2, 0]}
                targetHeight={1}
            />

            {/* Модель мебели Panel.glb */}
            <CustomModel
                modelPath="/models/Panel.glb"
                position={[0.53, 0.2, -4.5]}       // Положение: [X (влево/вправо), Y (высота), Z (вперед/назад)]
                rotation={[0, 1.56, 0]}       // Поворот: [наклон X, поворот Y, крен Z]
                targetHeight={1.0}         // Желаемая высота в метрах (например: 0.75 для стола, 1.8 для шкафа)
                color="#d8dfebff"
                metalness={0.9}
                roughness={0.25}
            />



            {/* 7. ПОТОЛОЧНАЯ ЛАМПА / ЛЮСТРА */}
            <DeskLamp
                modelPath="/models/lamp.glb"
                position={[0, 3.3, 0]}
                rotation={[1.5, 0, 1]}
                targetHeight={0.45}
                lightColor="#fef08a"
                lightIntensity={3.5}
                castShadow={false}
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

            {/* 10. ВТОРОЙ СТОЛ (СКАНДИНАВСКИЙ БЕЛЫЙ С ЧЕРНЫМИ РУЧКАМИ) */}
            <Table
                position={[1.3, 0.5, -5]}
                rotation={[1.6, 0, -0.43]}
                targetHeight={0.75}
                bodyColor="#f5f4ef"
                handleStyle="black"
            />

            {/* 11. ШКАФ С PBR-МАТЕРИАЛАМИ И ЧЕРНЫМИ РУЧКАМИ */}
            <Bookcase
                position={[1.75, 0, -3]}
                rotation={[0, 4.7, 0]}
                targetHeight={2.2}
            />

            {/* 12. МАНСАРДНАЯ НИША */}
            <WindowNiche />

            {/* 13. РАБОЧАЯ СТАНЦИЯ: МОНИТОР С ЭКРАНОМ И ФОРМОЙ ЗАКАЗА УСЛУГ */}
            <WorkstationMonitor />


            {/* СИСТЕМНЫЙ БЛОК КОМПЬЮТЕРА С PBR-ТЕКСТУРАМИ (Comp.glb) */}
            <Computer
                position={[-1.9, 0, -3]}
                rotation={[0, 0, 0]}
                targetHeight={0.6}
            />

            {/* КОМПЬЮТЕРНАЯ МЫШЬ С PBR-ТЕКСТУРАМИ */}
            <Mouse
                position={[-1.5, 1, -2.3]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.05}
            />

            {/* СТАКАНЧИК С КОФЕ */}
            <CoffeeCup
                position={[-1.6, 1, -2.5]}
                rotation={[4.75, 3.15, 1.6]}
                targetHeight={0.11}
            />


            <CustomModel
                modelPath="/models/paper1.glb"
                texturePath="/textures/paper/paper.jpeg"
                position={[1.58, 0.88, -4.35]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.0125}
                roughness={0.9}
            />

            {/* ВИНТАЖНЫЙ РАДИОПРИЕМНИК С PBR-ТЕКСТУРАМИ */}
            <Radio
                position={[1.6, 0.85, -4.1]}
                rotation={[1.5, -1.6, 1.5]}
                targetHeight={0.25}
            />

            {/* Мусорная корзина */}
            <Trashcan
                position={[-2, 0, -1.5]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.3}
            />

            {/* ОБУВНИЦА */}
            <ShoeRack
                position={[1, 0, 3.1]}
                rotation={[0, -0, 0]}
                targetHeight={0.4}
            />

            {/* ТАПОЧКИ */}
            <Slippers
                position={[0.3, 0.02, 2.69]}
                rotation={[0, 0, 0]}
                targetHeight={0.07}
            />

            {/* ПРИДВЕРНЫЙ КОВРИК С PBR-ТЕКСТУРАМИ */}
            <FloorMat
                position={[-0.12, 0, 2.9]}
                rotation={[0, 0, 0]}
                targetHeight={0.04}
            />

            <CustomModel
                modelPath="/models/paper2.glb"
                texturePath="/textures/paper/paper.jpeg"
                position={[1.35, 0.94, -4.85]}
                rotation={[1.45, 1.6, 1.5]}
                targetHeight={0.07}
                roughness={0.9}
            />
            {/* Подставка для ручек */}
            <PencilCup
                position={[-1.7, 1, -1.38]}
                rotation={[0, 0, 0]}
                targetHeight={0.15}
            />

            <CustomModel
                modelPath="/models/paper3.glb"
                texturePath="/textures/paper/paper.jpeg"
                position={[1.58, 0.88, -4.8]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.02}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Paper_Stack1.glb"
                texturePath="/textures/paper_Stack/PaperStack_tex512.png"
                position={[1.56, 0.88, -4.57]}
                rotation={[1.4, -1.55, 1.4]}
                targetHeight={0.0175}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Paper_Stack2.glb"
                texturePath="/textures/paper_Stack/PaperStack_tex512.png"
                position={[1.9, 0.88, -4.58]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.05}
                roughness={0.9}
            />

            <CustomModel
                modelPath="/models/Paper_Stack3.glb"
                texturePath="/textures/paper_Stack/PaperStack_tex512.png"
                position={[1.9, 0.88, -4.8]}
                rotation={[1.45, -1.6, 1.5]}
                targetHeight={0.2}
                roughness={0.9}
            />

            {/* АКУСТИЧЕСКИЕ КОЛОНКИ С PBR-ТЕКСТУРАМИ ДЕРЕВА */}
            <Speaker
                modelPath="/models/computerSpeakers.glb"
                position={[-2.12, 1, -2.65]}
                rotation={[0, 0.25, 0]}
                targetHeight={0.25}
            />

            <Speaker
                modelPath="/models/computerSpeakers2.glb"
                position={[-1.92, 1, -1.35]}
                rotation={[0, 1.2, 0]}
                targetHeight={0.25}
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



            {/* НАСТОЛЬНАЯ ЛАМПА (СКАНДИНАВСКИЙ ДУБ И СТАЛЬ) */}
            <Lmp
                position={[-1.75, 1.1, -2.4]}
                rotation={[1.6, 3, -2.6]}
                targetHeight={0.35}
                lightIntensity={1.2}
            />

            {/* МАРКЕРНАЯ ДОСКА С ОБЛОЖКАМИ КЕЙСОВ И 3D-МАГНИТИКОМ (ОТОДВИНУТА В ДРУГУЮ СТОРОНУ) */}
            <WhiteBoard
                position={[1.85, 0, -0.7]}
                rotation={[0, Math.PI / 2, 0]}
                targetHeight={1.75}
            />

            {/* НАСТЕННЫЙ ПРОЕКЦИОННЫЙ ЭКРАН (16:9) НА СТЕНЕ НАПРОТИВ ПРОЕКТОРА */}
            <ProjectorScreen
                position={[2.02, 1.85, 1.45]}
                rotation={[0, -Math.PI / 2, 0]}
                width={2.0}
                height={1.125}
            />

            {/* МЕХАНИЧЕСКАЯ ПЛАСТИКОВАЯ КЛАВИАТУРА С PBR-МАТЕРИАЛАМИ */}
            <Keyboard
                position={[-1.5, 1.02, -1.95]}
                rotation={[4.72, 3.2, 1.55]}
                targetHeight={0.1}
                preset="gradient"
            />


            {/* ЗОЛОТАЯ ВАЗА С PBR-ТЕКСТУРАМИ */}
            <Vase
                position={[-2.1, 1.66, 0.8]}
                rotation={[0, 0, 0]}
                targetHeight={0.3}
            />

            {/* БЕЛАЯ ПЛАСТИКОВАЯ РОЗЕТКА */}
            <CustomModel
                modelPath="/models/Outledt.glb"
                position={[2, 0.75, -1.75]}
                rotation={[0, -1.65, 1.59]}
                targetHeight={0.15}
                color="#f8fafc"
                roughness={0.22}
                metalness={0.0}
                clearcoat={0.45}
                clearcoatRoughness={0.18}
                castShadow
                receiveShadow
            />

            {/* ВЫКЛЮЧАТЕЛЬ СВЕТА НА СТЕНЕ У ВХОДА */}
            <LightSwitch
                position={[0.75, 1, 3.35]}
                rotation={[-1.5, 0, 0]}
                targetHeight={0.02}
            />

            {/* 13. ФОТОРАМКИ (1-я на полке шкафа, 2-я, 3-я и 4-я на стене в триптихе) */}
            <PhotoFrame
                image="/textures/LogoJV_framed.svg"
                position={[1.75, 0.9, -2.85]}
                rotation={[0, -1.6, 0]}
                targetHeight={0.25}
            />

            <PhotoFrame
                image="/textures/LogoBlue_framed.png"
                position={[-0.25, 1.45, -3.4]}
                rotation={[0.2, 0, 0]}
                targetHeight={0.5}
            />

            <PhotoFrame
                image="/textures/LogoEye_framed.png"
                position={[-0.98, 1.45, -3.4]}
                rotation={[0.2, 0, 0]}
                targetHeight={0.5}
            />

            <PhotoFrame
                image="/textures/LogoTeal_framed.png"
                position={[-1.71, 1.45, -3.4]}
                rotation={[0.2, 0, 0]}
                targetHeight={0.5}
            />

            {/* 4K ПРОЕКТОР НА ПОЛКЕ (ИНТЕРАКТИВНЫЙ, ВКЛЮЧАЕТ ЭКРАН НА ПРОТИВОПОЛОЖНОЙ СТЕНЕ) */}
            <Projector
                position={[-2.2, 1.78, 1.85]}
                rotation={[0, 0, 0]}
                targetHeight={0.15}
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

            {/* РЮКЗАК / СУМКА С PBR-ТЕКСТУРАМИ */}
            <Bag
                position={[-2.2, 2.13, 2.07]}
                rotation={[0, 1.6, 0]}
                targetHeight={0.3}
            />
            {/* Книги на полке*/}
            <Books
                position={[-2.12, 2.08, 0.9]}
                rotation={[0, -1.6, 0]}
                targetHeight={0.25}
            />
            {/* Сейф */}
            <CustomModel
                modelPath="/models/safe.glb"
                texturePath="/textures/safe/safe.jpg"
                position={[1.6, 1.55, -3.3]}
                rotation={[-1.56, 0, -1.55]}
                targetHeight={0.2}
                metalness={0.6}
                roughness={0.4}
            />

            {/* НАПОЛЬНАЯ ВЕШАЛКА-СТОЙКА */}
            <CoatTree
                position={[1.6, 0, 2.9]}
                rotation={[0, 0, 0]}
                targetHeight={2}
            />
            {/* Шкатулка */}
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

                <mesh position={[-1.56, 0.05, 3.335]}>
                    <boxGeometry args={[1.7, 0.1, 0.03]} />
                    <meshStandardMaterial color={darkBaseboardColor} roughness={0.5} />
                </mesh>

                <mesh position={[1.260, 0.05, 3.335]}>
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
                    <boxGeometry args={[2.86, 0.1, 0.03]} />
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