import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Полный реестр всех 3D-моделей проекта Jessie Volker Studio.
 * Все модели подгружаются заранее до показа сцены для предотвращения задержек и фризов.
 */
export const SCENE_MODELS = [
    '/models/WorkCenter.glb',
    '/models/Table.glb',
    '/models/Rockworth.glb',
    '/models/Chairs.glb',
    '/models/Comp.glb',
    '/models/Monitor.glb',
    '/models/MechKeyboard1.glb',
    '/models/Mouse.glb',
    '/models/computerSpeakers.glb',
    '/models/computerSpeakers2.glb',
    '/models/radio.glb',
    '/models/EVPSVPL.glb',
    '/models/lightSwitch.glb',
    '/models/Lmp.glb',
    '/models/lamp.glb',
    '/models/Pencil_cup.glb',
    '/models/Trashcan_full.glb',
    '/models/Bag.glb',
    '/models/BeanBag.glb',
    '/models/Books.glb',
    '/models/books_TextuePack_2.glb',
    '/models/coatTree.glb',
    '/models/coffee.glb',
    '/models/ElectricKettle.glb',
    '/models/floorMat.glb',
    '/models/frame.glb',
    '/models/SM_JewelleryBox01_Body.glb',
    '/models/SM_JewelleryBox01_Head.glb',
    '/models/ShoeRack.glb',
    '/models/Slipper.glb',
    '/models/vase.glb',
    '/models/whiteBoard.glb',
    '/models/Magnet.glb',
    '/models/Panel.glb',
    '/models/DeltaLaserline.glb',
    '/models/Paper_Stack1.glb',
    '/models/Paper_Stack2.glb',
    '/models/Paper_Stack3.glb',
    '/models/paper1.glb',
    '/models/paper2.glb',
    '/models/paper3.glb',
    '/models/paper4.glb',
    '/models/Outledt.glb',
    '/models/safe.glb',
]

/**
 * Ключевые текстуры материалов офиса
 */
export const SCENE_TEXTURES = [
    '/textures/table/Wood_Desk_Diffuse.png',
    '/textures/table/Wood_Desk_Normal.png',
    '/textures/table/Wood_Desk_Reflection.png',
    '/textures/radio/OldRadio_Wood_Diffuse.png',
    '/textures/radio/OldRadio_Wood_Normal.png',
    '/textures/radio/OldRadio_Wood_Reflection.png',
    '/textures/radio/OldRadio_Text-Metal_Diffuse.png',
    '/textures/radio/OldRadio_Text-Metal_Reflection.png',
    '/textures/radio/OldRadio_Button_Diffuse.png',
    '/textures/radio/OldRadio_Button_Reflection.png',
    '/textures/Lmp/FloorLamp_Textures_Oak_Diffuse.png',
    '/textures/Lmp/FloorLamp_Textures_Oak_Normal.png',
    '/textures/Lmp/FloorLamp_Textures_Oak_Reflection.png',
    '/textures/Lmp/FloorLamp_Textures_Floor_Diffuse.png',
    '/textures/Lmp/FloorLamp_Textures_Floor_Normal.png',
    '/textures/Light/DiffuseButtonSwitch.png',
    '/textures/Light/DiffuseSwitch.png',
    '/textures/Light/MetalicButtonSwitch.png',
    '/textures/Light/MetalicSwitch.png',
    '/textures/keyboard/Base_Color.png',
    '/textures/keyboard/Metallic.png',
    '/textures/keyboard/Roughness.png',
    '/textures/comp/Textures_Metal.png',
    '/textures/comp/Textures_Metal_R.png',
    '/textures/comp/Textures_Metal_Gloss.png',
    '/textures/coatTree/coatTree_Roughness.png',
    '/textures/coatTree/coatTree_Normal.png',
    '/textures/floorMat/mat_roughness.png',
    '/textures/floorMat/mat_normal.png',
    '/textures/cases/case1.png',
    '/textures/cases/case2.png',
    '/textures/cases/case3.png',
    '/textures/cases/case4.png',
    '/textures/LogoJV_framed.svg',
    '/textures/58.jpg',
]

let isPreloadStarted = false

/**
 * Запускает параллельную предзагрузку всех моделей и текстур через DefaultLoadingManager Three.js.
 * Это гарантирует, что Drei useProgress() отслеживает 100% реальных ассетов проекта.
 */
export function preloadAllAssets() {
    if (isPreloadStarted || typeof window === 'undefined') return
    isPreloadStarted = true

    // 1. Предзагрузка всех 3D-моделей
    SCENE_MODELS.forEach((modelUrl) => {
        try {
            useGLTF.preload(modelUrl)
        } catch { }
    })

    // 2. Предзагрузка текстур через Three.js TextureLoader (подключается к DefaultLoadingManager)
    const textureLoader = new THREE.TextureLoader()
    SCENE_TEXTURES.forEach((textureUrl) => {
        try {
            useTexture.preload(textureUrl)
            textureLoader.load(textureUrl, undefined, undefined, () => { })
        } catch { }
    })
}
