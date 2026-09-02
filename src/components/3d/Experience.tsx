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
            {/* 1. Мягкий комнатный рассеянный свет */}
            <ambientLight intensity={0.55} color="#ffffff" />

            {/* 2. СОЛНЦЕ ИЗ МАНСАРДНОГО ОКНА (Светит справа из ниши на стол и пол) */}
            <directionalLight
                position={[3.5, 5.0, -4.5]}
                intensity={2.2}
                color="#fffbeb"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            />

            {/* 3. Дневной холодный свет в проеме ниши */}
            <pointLight position={[2.2, 2.5, -4.5]} intensity={2.0} distance={5} color="#e0f2fe" />

            {/* 4. Мягкий свет в центре комнаты */}
            <pointLight position={[-0.5, 3.2, 0]} intensity={1.2} distance={8} color="#f8fafc" />

            <Suspense fallback={<Loader />}>
                <Physics gravity={[0, -9.81, 0]}>
                    <Player />
                    <Room />
                </Physics>

                {/* Постобработка */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={0.75}
                        luminanceSmoothing={0.9}
                        intensity={0.5}
                        mipmapBlur
                    />
                    <Vignette eskil={false} offset={0.15} darkness={0.5} />
                </EffectComposer>
            </Suspense>

            <PointerLockControls
                onLock={() => setIsLocked(true)}
                onUnlock={() => setIsLocked(false)}
            />
        </Canvas>
    )
}