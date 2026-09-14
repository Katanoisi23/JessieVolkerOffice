import { useState, useEffect, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'
import { CustomModel } from './CustomModel'

// Звуковой эффект клика / фокусировки / отправки
function playChime(freq1 = 440, freq2 = 880, duration = 0.16) {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq1, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration * 0.8)
        gain.gain.setValueAtTime(0.14, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
    } catch { }
}

interface UxUiMessage {
    id: string
    name: string
    contact: string
    category: string
    message: string
    time: string
    isNew?: boolean
}

export function WorkstationMonitor() {
    const { camera } = useThree()
    const isComputerFocused = useOfficeStore((state) => state.isComputerFocused)
    const setIsComputerFocused = useOfficeStore((state) => state.setIsComputerFocused)
    const activeInteraction = useOfficeStore((state) => state.activeInteraction)
    const setActiveInteraction = useOfficeStore((state) => state.setActiveInteraction)

    const [isNear, setIsNear] = useState(false)

    // Поля формы UX/UI
    const [contact, setContact] = useState('')
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Mobile App')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [statusSuccess, setStatusSuccess] = useState(false)

    // Сообщения на форуме / в очереди UX/UI
    const [messages, setMessages] = useState<UxUiMessage[]>([
        {
            id: '#UX-914',
            name: 'Виктория С.',
            contact: '+7 (916) ***-24-11',
            category: 'Mobile App',
            message: 'Дизайн iOS приложения (финтех): 35 экранов, UI-kit в Figma и кликабельный прототип.',
            time: '12:40',
        },
        {
            id: '#UX-882',
            name: 'Михаил Т.',
            contact: '@mike_tech',
            category: 'Web / SaaS',
            message: 'Редизайн аналитического дашборда и разработка дизайн-системы для B2B платформы.',
            time: 'Вчера',
        },
    ])

    // Точные координаты экрана: центрированы на физическом мониторе
    const screenPos = useMemo<[number, number, number]>(() => [-2.05, 1.32, -1.98], [])
    const screenRot = useMemo<[number, number, number]>(() => [0, Math.PI / 2, 0], [])
    const monitorTargetVec = useMemo(() => new THREE.Vector3(-2.05, 1.32, -1.98), [])

    const camDir = useMemo(() => new THREE.Vector3(), [])
    const toMonitor = useMemo(() => new THREE.Vector3(), [])

    // Проверка дистанции для интерактивной подсказки
    useFrame(() => {
        const distance = camera.position.distanceTo(monitorTargetVec)
        camera.getWorldDirection(camDir)
        toMonitor.subVectors(monitorTargetVec, camera.position).normalize()
        const dot = camDir.dot(toMonitor)

        const isTargeted = distance <= 2.6 && dot >= 0.55

        if (isTargeted && !isComputerFocused) {
            if (activeInteraction === null || activeInteraction === 'computer') {
                if (activeInteraction !== 'computer') setActiveInteraction('computer')
                if (!isNear) setIsNear(true)
            }
        } else {
            if (activeInteraction === 'computer') {
                setActiveInteraction(null)
            }
            if (isNear) setIsNear(false)
        }
    })

    // Горячая клавиша [E] для взаимодействия
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isComputerFocused) return
            if (!isNear || activeInteraction !== 'computer') return
            if (
                e.code === 'KeyE' ||
                e.key === 'e' ||
                e.key === 'E' ||
                e.key === 'у' ||
                e.key === 'У'
            ) {
                e.preventDefault()
                setIsComputerFocused(true)
                setActiveInteraction(null)
                playChime(360, 720, 0.18)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNear, isComputerFocused, activeInteraction, setIsComputerFocused, setActiveInteraction])

    // Отправка заявки
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!contact.trim() || !message.trim()) return

        setIsSubmitting(true)
        playChime(480, 640, 0.12)

        setTimeout(() => {
            const newMsg: UxUiMessage = {
                id: `#UX-${Math.floor(100 + Math.random() * 900)}`,
                name: name.trim() || 'Клиент',
                contact: contact.trim(),
                category,
                message: message.trim(),
                time: 'Только что',
                isNew: true,
            }

            setMessages((prev) => [newMsg, ...prev])
            setIsSubmitting(false)
            setStatusSuccess(true)
            setMessage('')
            playChime(520, 1040, 0.25)

            setTimeout(() => setStatusSuccess(false), 4500)
        }, 500)
    }

    return (
        <group>
            {/* МОДЕЛЬ МОНИТОРА НА СТОЛЕ */}
            <CustomModel
                modelPath="/models/Monitor.glb"
                position={[-2.2, 1.32, -2]}
                rotation={[4.72, 3.2, 1.63]}
                targetHeight={0.6}
                color="#14171f"
                roughness={0.4}
                metalness={0.3}
            />

            {/* Мягкая подсветка рабочего стола от включенного экрана */}
            <pointLight
                position={[-1.95, 1.32, -1.98]}
                intensity={0.4}
                distance={1.5}
                decay={1.6}
                color="#38bdf8"
            />

            {/* ДИСПЛЕЙ: ПОЛНОРАЗМЕРНЫЙ РАБОЧИЙ СТОЛ СТУДИИ НА ВСЮ МАТРИЦУ МОНИТОРА */}
            <group position={screenPos} rotation={screenRot}>
                <Html
                    transform
                    center
                    occlude={!isComputerFocused}
                    distanceFactor={0.45}
                    position={[0, 0.05, 0]}
                    zIndexRange={[100, 0]}
                    className="select-none"
                >
                    {/* РАБОЧИЙ СТОЛ OS (ЗАПОЛНЯЕТ ВСЮ МАТРИЦУ ЭКРАНА С ОБОЯМИ И ОКНОМ) */}
                    <div
                        onClick={(e) => {
                            if (!isComputerFocused) {
                                e.stopPropagation()
                                setIsComputerFocused(true)
                                playChime(360, 720, 0.18)
                            }
                        }}
                        style={{
                            width: '980px',
                            height: '500px',
                            background:
                                'radial-gradient(circle at 50% 25%, #131c2e 0%, #090e18 55%, #05070d 100%)',
                            color: '#e2e8f0',
                            borderRadius: '0px',
                            border: '1px solid #141c2c',
                            boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.9)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            fontFamily:
                                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            boxSizing: 'border-box',
                            cursor: isComputerFocused ? 'default' : 'pointer',
                            position: 'relative',
                        }}
                    >
                        {/* 1. Верхнее меню операционной системы (macOS-style Menu Bar) */}
                        <div
                            style={{
                                height: '26px',
                                backgroundColor: 'rgba(10, 15, 26, 0.85)',
                                backdropFilter: 'blur(16px)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 14px',
                                fontSize: '10.5px',
                                color: '#94a3b8',
                                flexShrink: 0,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                                    🎨 Jessie Volker Studio
                                </span>
                                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Figma</span>
                                <span>Бриф & Заявки</span>
                                <span>Портфолио</span>
                                <span>Вид</span>
                                <span>Окно</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '10.5px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            backgroundColor: '#22c55e',
                                            boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                                        }}
                                    />
                                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Studio Online</span>
                                </div>
                                <span style={{ color: '#64748b' }}>|</span>
                                <span style={{ color: '#94a3b8' }}>100% 🔋</span>
                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>14:30</span>
                            </div>
                        </div>

                        {/* 2. Рабочий стол: в центре открыто окно Figma с формой заказа */}
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px 12px',
                                position: 'relative',
                            }}
                        >
                            {/* ОКНО ПРИЛОЖЕНИЯ FIGMA / UX-UI BRIEF */}
                            <div
                                style={{
                                    width: '950px',
                                    height: '415px',
                                    backgroundColor: '#0a0f1c',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    boxShadow:
                                        '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Заголовок окна Figma с точками управления */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '9px 16px',
                                        backgroundColor: '#0c1322',
                                        borderBottom: '1px solid #1a2438',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.85 }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308', opacity: 0.85 }} />
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.85 }} />
                                        </div>
                                        <span
                                            style={{
                                                marginLeft: '10px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                letterSpacing: '0.04em',
                                                color: '#cbd5e1',
                                            }}
                                        >
                                            Figma — Jessie Volker | UX / UI Design Order & Queue
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                                color: '#38bdf8',
                                                fontWeight: 600,
                                            }}
                                        >
                                            ● В сети: приём заказов
                                        </span>
                                    </div>
                                </div>

                                {/* Рабочая область окна (2 колонки) */}
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'grid',
                                        gridTemplateColumns: '1.08fr 0.92fr',
                                        gap: '14px',
                                        padding: '12px 16px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Левая колонка: интерактивная форма заказа */}
                                    <form
                                        onSubmit={handleSubmit}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            backgroundColor: '#080d18',
                                            padding: '12px 14px',
                                            borderRadius: '6px',
                                            border: '1px solid #172033',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                                                Заказать UX/UI Дизайн
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                                                Мобильные приложения, SaaS-дашборды, дизайн-системы
                                            </div>
                                        </div>

                                        {/* Телефон или Telegram */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#38bdf8', marginBottom: '3px' }}>
                                                Номер телефона или Telegram *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={contact}
                                                onChange={(e) => setContact(e.target.value)}
                                                placeholder="+7 (___) ___-__-__ или @username"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#04070f',
                                                    border: '1px solid #1e293b',
                                                    color: '#ffffff',
                                                    fontSize: '11px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                }}
                                            />
                                        </div>

                                        {/* Имя и тип задачи */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '3px' }}>
                                                    Ваше имя
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Имя / компания"
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 10px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#04070f',
                                                        border: '1px solid #1e293b',
                                                        color: '#ffffff',
                                                        fontSize: '11px',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '3px' }}>
                                                    Тип задачи
                                                </label>
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '5px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#04070f',
                                                        border: '1px solid #1e293b',
                                                        color: '#38bdf8',
                                                        fontSize: '10.5px',
                                                        fontWeight: 600,
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                    }}
                                                >
                                                    <option value="Mobile App">Mobile App (iOS/Android)</option>
                                                    <option value="Web / SaaS">Web & SaaS Dashboard</option>
                                                    <option value="UX Audit">UX Аудит & Редизайн</option>
                                                    <option value="Design System">Дизайн-система (Figma)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Сообщение */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '3px' }}>
                                                Сообщение / пожелания к проекту *
                                            </label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Опишите продукт, платформу, количество экранов или ссылку на ТЗ..."
                                                style={{
                                                    width: '100%',
                                                    flex: 1,
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#04070f',
                                                    border: '1px solid #1e293b',
                                                    color: '#ffffff',
                                                    fontSize: '11px',
                                                    outline: 'none',
                                                    resize: 'none',
                                                    boxSizing: 'border-box',
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        </div>

                                        {/* Кнопка отправки и статус */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                            {statusSuccess ? (
                                                <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700 }}>
                                                    ✓ Заявка принята дизайнером!
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                                                    Figma / Interactive Prototype
                                                </span>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '4px',
                                                    backgroundColor: isSubmitting ? '#0284c7' : '#0284c7',
                                                    color: '#ffffff',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    letterSpacing: '0.04em',
                                                    border: 'none',
                                                    cursor: isSubmitting ? 'wait' : 'pointer',
                                                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                                                    transition: 'background-color 0.15s ease',
                                                }}
                                            >
                                                {isSubmitting ? 'ОТПРАВКА...' : 'ЗАКАЗАТЬ UX/UI'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Правая колонка: живая очередь проектов */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8' }}>
                                                ОЧЕРЕДЬ ПРОЕКТОВ ({messages.length})
                                            </span>
                                            <span style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 600 }}>● Live Queue</span>
                                        </div>

                                        <div
                                            style={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                paddingRight: '3px',
                                            }}
                                        >
                                            {messages.map((m) => (
                                                <div
                                                    key={m.id}
                                                    style={{
                                                        padding: '8px 10px',
                                                        borderRadius: '5px',
                                                        backgroundColor: m.isNew ? 'rgba(56, 189, 248, 0.08)' : '#080d18',
                                                        border: m.isNew ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #172033',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '2px',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#f8fafc' }}>
                                                                {m.name}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '9px',
                                                                    padding: '1px 5px',
                                                                    borderRadius: '3px',
                                                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                                                    color: '#38bdf8',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {m.category}
                                                            </span>
                                                        </div>
                                                        <span style={{ fontSize: '9px', color: '#64748b' }}>{m.time}</span>
                                                    </div>

                                                    <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.3 }}>
                                                        {m.message}
                                                    </div>

                                                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                                                        Связь: <span style={{ color: '#94a3b8' }}>{m.contact}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Подвал окна */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '5px 14px',
                                        backgroundColor: '#070b14',
                                        borderTop: '1px solid #141c2c',
                                        fontSize: '9.5px',
                                        color: '#64748b',
                                    }}
                                >
                                    <span>Figma • Client Brief Mode</span>
                                    <span>{isComputerFocused ? '⌨️ Режим ввода активен' : 'Кликните для ввода'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Нижний macOS Dock с иконками приложений и кнопкой выхода */}
                        <div
                            style={{
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingBottom: '4px',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '4px 16px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(10, 16, 28, 0.85)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>🎨</span>
                                <span style={{ fontSize: '14px' }}>🌐</span>
                                <span style={{ fontSize: '14px' }}>⚡</span>
                                <span style={{ fontSize: '14px' }}>📁</span>
                                <span style={{ fontSize: '14px' }}>⚙️</span>
                                <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
                                {isComputerFocused ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsComputerFocused(false)
                                            playChime(720, 360, 0.15)
                                        }}
                                        style={{
                                            backgroundColor: '#38bdf8',
                                            color: '#070b14',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '2px 8px',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        [ESC] ВЫХОД
                                    </button>
                                ) : (
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                        Нажмите [E] для работы за ПК
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Html>
            </group>

            {/* Всплывающая подсказка над монитором при приближении к столу */}
            {isNear && !isComputerFocused && (
                <Html
                    position={[-2.04, 1.70, -1.98]}
                    center
                    distanceFactor={2.5}
                    zIndexRange={[100, 0]}
                    occlude
                    className="pointer-events-none select-none"
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(11, 16, 28, 0.94)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                        }}
                    >
                        <span style={{ fontSize: '13px' }}>🎨</span>
                        <span
                            style={{
                                fontWeight: 700,
                                fontSize: '11px',
                                letterSpacing: '0.04em',
                                color: '#f8fafc',
                            }}
                        >
                            UX / UI ДИЗАЙН: ЗАКАЗ
                        </span>

                        <div
                            style={{
                                width: '1px',
                                height: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                margin: '0 2px',
                            }}
                        />

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                color: '#94a3b8',
                            }}
                        >
                            <span>press</span>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '18px',
                                    height: '18px',
                                    padding: '0 5px',
                                    borderRadius: '4px',
                                    color: '#0f172a',
                                    fontFamily: 'ui-monospace, monospace',
                                    fontWeight: 700,
                                    fontSize: '10.5px',
                                    lineHeight: 1,
                                    backgroundColor: '#38bdf8',
                                }}
                            >
                                E
                            </span>
                        </div>
                    </div>
                </Html>
            )}

            {/* Кнопка быстрого выхода под монитором */}
            {isComputerFocused && (
                <Html
                    position={[-2.04, 0.96, -1.98]}
                    center
                    distanceFactor={2.4}
                    zIndexRange={[100, 0]}
                    className="pointer-events-auto select-none"
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(11, 16, 28, 0.94)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '11px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
                        }}
                    >
                        <span style={{ fontSize: '13px' }}>🎨</span>
                        <span style={{ letterSpacing: '0.04em', fontWeight: 600, color: '#f8fafc' }}>
                            РЕЖИМ ЗАПОЛНЕНИЯ UX/UI
                        </span>
                        <div style={{ width: '1px', height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 2px' }} />
                        <button
                            type="button"
                            onClick={() => {
                                setIsComputerFocused(false)
                                playChime(720, 360, 0.15)
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#38bdf8',
                                color: '#0f172a',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '10.5px',
                                fontWeight: 700,
                            }}
                        >
                            <span>[ESC / E]</span>
                            <span>ВЫХОД</span>
                        </button>
                    </div>
                </Html>
            )}
        </group>
    )
}