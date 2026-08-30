import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PointerLockControls, Html } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Room } from './Room'
import { Player } from './Player'
import { useOfficeStore } from '../../stores/useOfficeStore'

function Loader() {
    return (
        <Html center>
            <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/90 border border-neutral-800 rounded-lg text-white font-mono text-sm shadow-xl">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span>Загрузка 4K текстур...</span>
            </div>
        </Html>
    )
}

export function Experience() {
    const setIsLocked = useOfficeStore((state) => state.setIsLocked)

    return (
        <Canvas
            shadows
            camera={{ fov: 70, position: [0, 1.7, 3] }}
            style={{ width: '100vw', height: '100vh', display: 'block' }}
        >
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[5, 8, 5]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[0, 3, -1]} intensity={1.5} color="#cbd5e1" />

            <Suspense fallback={<Loader />}>
                <Physics gravity={[0, -9.81, 0]}>
                    <Player />
                    <Room />
                </Physics>
            </Suspense>

            <PointerLockControls
                onLock={() => setIsLocked(true)}
                onUnlock={() => setIsLocked(false)}
            />
        </Canvas>
    )
}