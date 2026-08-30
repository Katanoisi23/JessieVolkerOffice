import { Canvas } from '@react-three/fiber'
import { PointerLockControls, Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Room } from './Room'
import { Player } from './Player'
import { useOfficeStore } from '../../stores/useOfficeStore'

export function Experience() {
    const isLocked = useOfficeStore((state) => state.isLocked)
    const setIsLocked = useOfficeStore((state) => state.setIsLocked)

    return (
        <Canvas
            shadows
            camera={{ fov: 70, position: [0, 1.7, 3] }}
            style={{ width: '100vw', height: '100vh', display: 'block' }}
        >
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[5, 8, 5]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[0, 3, -1]} intensity={1} color="#60a5fa" />

            <Physics gravity={[0, -9.81, 0]}>
                <Player />
                <Room />
            </Physics>

            <PointerLockControls
                onLock={() => setIsLocked(true)}
                onUnlock={() => setIsLocked(false)}
            />
        </Canvas>
    )
}