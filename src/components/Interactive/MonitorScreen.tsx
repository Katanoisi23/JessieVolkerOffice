import { Html } from '@react-three/drei'
import { useState } from 'react'

export function MonitorScreen() {
    const [activeTab, setActiveTab] = useState<'about' | 'projects'>('about')

    return (
        <group position={[0, 1.25, -1.88]}>
            {/* Сам физический корпус монитора */}
            <mesh>
                <boxGeometry args={[1.6, 0.9, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
            </mesh>

            {/* Интерактивный HTML экран */}
            <Html
                transform
                occlude
                distanceFactor={1.2}
                position={[0, 0, 0.03]}
                className="w-[600px] h-[340px] bg-neutral-950 text-neutral-100 rounded-lg p-5 border border-neutral-800 shadow-2xl overflow-y-auto"
            >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs font-mono text-neutral-400">workspace_terminal.sh</span>
                </div>

                <div className="flex space-x-4 mb-4 text-xs font-mono">
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`px-3 py-1 rounded transition ${activeTab === 'about' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        ~/о-себе
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`px-3 py-1 rounded transition ${activeTab === 'projects' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        ~/проекты
                    </button>
                </div>

                {activeTab === 'about' ? (
                    <div className="text-sm space-y-2 font-mono">
                        <p className="text-emerald-400">➜ Добро пожаловать в виртуальный 3D-офис!</p>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                            Исследуйте пространство, управляя персонажем (WASD + мышь).
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 font-mono text-xs">
                        <div className="p-3 bg-neutral-900 rounded border border-neutral-800">
                            <h4 className="font-bold text-neutral-200">PragmaFocus</h4>
                            <p className="text-neutral-400 mt-1">Приложение для фокуса и продуктивности.</p>
                        </div>
                        <div className="p-3 bg-neutral-900 rounded border border-neutral-800">
                            <h4 className="font-bold text-neutral-200">Sportpit-app</h4>
                            <p className="text-neutral-400 mt-1">Трекер спортивного питания и тренировок.</p>
                        </div>
                    </div>
                )}
            </Html>
        </group>
    )
}