import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PointerLockControls, Html } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Room } from './Room'
import { Player } from './Player'
import { useOfficeStore } from '../../stores/useOfficeStore'

function Loader() {
    return (
        <Html center>
            <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/90 border border-neutral-800 rounded-lg text-white font-mono text-sm shadow-xl">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span>Загрузка офиса...</span>
            </div>
        </Html>
    )
}

export function Experience() {
    const setIsLocked = useOfficeStore((state) => state.setIsLocked)

    return (
        <Canvas
            shadows
            camera={{ fov: 65, position: [0, 1.7, 2.5] }}
            style={{ width: '100vw', height: '100vh', display: 'block' }}
        >
            {/* 1. Мягкий базовый свет */}
            <ambientLight intensity={0.4} />

            {/* 2. Направленный свет с тенями */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={1.0}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            />

            {/* 3. Теплый свет над столом */}
            <pointLight position={[0, 2.8, -1.8]} intensity={2.5} distance={5} color="#fff4e6" />

            {/* 4. Рассеянный свет по центру комнаты */}
            <pointLight position={[0, 1.2, -1.8]} intensity={1.2} distance={6} color="#94a3b8" />

            <Suspense fallback={<Loader />}>
                <Physics gravity={[0, -9.81, 0]}>
                    <Player />
                    <Room />
                </Physics>

                {/* 5. Постобработка (Bloom и виньетка) */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={0.7}
                        luminanceSmoothing={0.9}
                        intensity={0.6}
                        mipmapBlur
                    />
                    <Vignette eskil={false} offset={0.15} darkness={0.6} />
                </EffectComposer>
            </Suspense>

            <PointerLockControls
                onLock={() => setIsLocked(true)}
                onUnlock={() => setIsLocked(false)}
            />
        </Canvas>
    )
}