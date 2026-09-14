import { Suspense, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import { Room } from './Room'
import { Player } from './Player'
import { PostEffects } from './PostEffects'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { getGlobalAudioListener } from '../../utils/audioSystem'

function Loader() {
    return null
}

function AudioListenerSetup() {
    const { camera } = useThree()

    useEffect(() => {
        const listener = getGlobalAudioListener()
        camera.add(listener)
        return () => {
            camera.remove(listener)
        }
    }, [camera])

    useFrame(() => {
        const listener = getGlobalAudioListener()
        // КРИТИЧНО: сначала обновляем мировую матрицу камеры, затем слушателя Three.js
        camera.updateMatrixWorld()
        listener.updateMatrixWorld()
    })

    return null
}

export function Experience() {
    const setIsLocked = useOfficeStore((state) => state.setIsLocked)
    const isRoomLightOn = useOfficeStore((state) => state.isRoomLightOn)
    const isRadioFocused = useOfficeStore((state) => state.isRadioFocused)
    const isComputerFocused = useOfficeStore((state) => state.isComputerFocused)
    const isScreenFocused = useOfficeStore((state) => state.isScreenFocused)
    const hasEntered = useOfficeStore((state) => state.hasEntered)

    const isInteracting = isRadioFocused || isComputerFocused || isScreenFocused

    // При входе в режим взаимодействия (радио, монитор) принудительно освобождаем курсор
    useEffect(() => {
        if (isInteracting) {
            document.exitPointerLock?.()
            setIsLocked(false)
        }
    }, [isInteracting, setIsLocked])

    return (
        <Canvas
            shadows
            dpr={[1, 1.5]}
            camera={{ fov: 65, position: [-0.15, 1.55, 2.8] }}
            gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 0.85,
                powerPreference: 'high-performance',
            }}
            style={{ width: '100vw', height: '100vh', display: 'block' }}
        >
            {/* Пространственный 3D-звук (привязка ушей слушателя к камере игрока) */}
            <AudioListenerSetup />

            {/* Мягкая атмосферная глубина */}
            <fog
                attach="fog"
                args={[isRoomLightOn ? '#171f2b' : '#070b14', 9.0, 26.0]}
            />

            {/* 1. Мягкий комнатный рассеянный свет */}
            <ambientLight
                intensity={isRoomLightOn ? 0.38 : 0.04}
                color={isRoomLightOn ? '#ffffff' : '#0d1527'}
            />

            {/* 2. ВЕРХНИЙ СВЕТ ОФИСА (быстрые тени 1024x1024) */}
            <directionalLight
                position={[2.5, 4.8, 1.5]}
                intensity={isRoomLightOn ? 0.95 : 0}
                color="#fffcf5"
                castShadow={true}
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0001}
                shadow-normalBias={0.02}
                shadow-camera-near={0.5}
                shadow-camera-far={12}
                shadow-camera-left={-4}
                shadow-camera-right={4}
                shadow-camera-top={4}
                shadow-camera-bottom={-4}
            />

            {/* 3. Равномерная подсветка рабочей зоны */}
            <pointLight
                position={[-0.5, 2.3, -1.2]}
                intensity={isRoomLightOn ? 0.35 : 0}
                distance={9}
                decay={1.2}
                color="#ffffff"
            />
            <pointLight
                position={[0.5, 2.3, 1.2]}
                intensity={isRoomLightOn ? 0.28 : 0}
                distance={9}
                decay={1.2}
                color="#ffffff"
            />

            {/* 4. Мягкий дневной свет из мансардного окна */}
            <pointLight
                position={[1.3, 2.2, -4.4]}
                intensity={isRoomLightOn ? 0.45 : 0.25}
                distance={6.0}
                decay={1.2}
                color="#dbeafe"
            />
            <directionalLight
                position={[2.8, 4.2, -5.8]}
                intensity={isRoomLightOn ? 0.35 : 0.18}
                color="#e0f2fe"
                castShadow={false}
            />

            <Suspense fallback={<Loader />}>
                <Physics gravity={[0, -9.81, 0]}>
                    <Player />
                    <Room />
                </Physics>

                <PostEffects />
            </Suspense>

            <PointerLockControls
                enabled={hasEntered && !isInteracting}
                onLock={() => setIsLocked(true)}
                onUnlock={() => setIsLocked(false)}
            />
        </Canvas>
    )
}