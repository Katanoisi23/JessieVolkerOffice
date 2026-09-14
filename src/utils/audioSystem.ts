import * as THREE from 'three'

let globalAudioListener: THREE.AudioListener | null = null

/**
 * Единый глобальный Three.js AudioListener, прикрепленный к камере игрока.
 * Автоматически отслеживает положение ушей игрока в пространстве и направление взгляда.
 */
export function getGlobalAudioListener(): THREE.AudioListener {
    if (!globalAudioListener) {
        globalAudioListener = new THREE.AudioListener()

        const unlockContext = () => {
            if (globalAudioListener?.context && globalAudioListener.context.state === 'suspended') {
                globalAudioListener.context.resume().catch(() => { })
            }
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('click', unlockContext)
            window.addEventListener('keydown', unlockContext)
            window.addEventListener('pointerdown', unlockContext)
            window.addEventListener('touchstart', unlockContext)
        }
    }

    if (globalAudioListener.context && globalAudioListener.context.state === 'suspended') {
        globalAudioListener.context.resume().catch(() => { })
    }

    return globalAudioListener
}

/**
 * Гарантирует активное состояние AudioContext
 */
export function ensureAudioContext(): AudioContext | null {
    const listener = getGlobalAudioListener()
    if (listener.context && listener.context.state === 'suspended') {
        listener.context.resume().catch(() => { })
    }
    return listener.context
}

/**
 * Создает настроенный THREE.PositionalAudio для любого 3D-предмета (Радио, Проектор, Выключатель)
 */
export function createSpatialAudio(options?: {
    refDistance?: number
    maxDistance?: number
    rolloffFactor?: number
    distanceModel?: 'linear' | 'inverse' | 'exponential'
}): THREE.PositionalAudio {
    const listener = getGlobalAudioListener()
    const posAudio = new THREE.PositionalAudio(listener)

    posAudio.setRefDistance(options?.refDistance ?? 2.4)
    posAudio.setMaxDistance(options?.maxDistance ?? 24.0)
    posAudio.setRolloffFactor(options?.rolloffFactor ?? 0.95)
    posAudio.setDistanceModel(options?.distanceModel ?? 'inverse')

    return posAudio
}
