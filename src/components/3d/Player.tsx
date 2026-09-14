import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'

const WALK_SPEED = 2.2
const SPRINT_SPEED = 4.6
const forwardVec = new THREE.Vector3()
const rightVec = new THREE.Vector3()
const upVec = new THREE.Vector3(0, 1, 0)
const directionVec = new THREE.Vector3()

export function Player() {
    const body = useRef<RapierRigidBody>(null)
    const { camera } = useThree()
    const isLocked = useOfficeStore((state) => state.isLocked)
    const isScreenFocused = useOfficeStore((state) => state.isScreenFocused)
    const setIsScreenFocused = useOfficeStore((state) => state.setIsScreenFocused)
    const isComputerFocused = useOfficeStore((state) => state.isComputerFocused)
    const setIsComputerFocused = useOfficeStore((state) => state.setIsComputerFocused)
    const isRadioFocused = useOfficeStore((state) => state.isRadioFocused)
    const setIsRadioFocused = useOfficeStore((state) => state.setIsRadioFocused)

    const screenFocusProgress = useRef(0)
    const computerFocusProgress = useRef(0)
    const radioFocusProgress = useRef(0)
    const screenTargetPos = useMemo(() => new THREE.Vector3(0.65, 1.85, 1.45), [])
    const computerTargetPos = useMemo(() => new THREE.Vector3(-1.40, 1.32, -1.98), [])
    const radioTargetPos = useMemo(() => new THREE.Vector3(1.35, 1.05, -3.65), [])

    const currentSpeed = useRef(WALK_SPEED)

    const keys = useRef<{ [key: string]: boolean }>({
        KeyW: false,
        KeyS: false,
        KeyA: false,
        KeyD: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        ShiftLeft: false,
        ShiftRight: false,
    })

    // Выход из PointerLock при фокусировке на компьютере или радио
    useEffect(() => {
        if (isComputerFocused || isRadioFocused) {
            document.exitPointerLock?.()
        }
    }, [isComputerFocused, isRadioFocused])

    // Начальное положение и поворот камеры: у двери, взгляд строго прямо вперед в офис
    useEffect(() => {
        camera.rotation.order = 'YXZ'
        camera.rotation.set(0, 0, 0)
        camera.position.set(-0.15, 1.55, 2.8)
    }, [camera])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement
            const isTyping =
                activeEl &&
                (activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.tagName === 'SELECT')

            if (isRadioFocused) {
                if (e.code === 'Escape') {
                    e.preventDefault()
                    setIsRadioFocused(false)
                    return
                }
                if (
                    !isTyping &&
                    (e.code === 'KeyE' ||
                        e.key === 'e' ||
                        e.key === 'E' ||
                        e.key === 'у' ||
                        e.key === 'У')
                ) {
                    e.preventDefault()
                    setIsRadioFocused(false)
                    return
                }
            }

            if (isComputerFocused) {
                if (e.code === 'Escape') {
                    e.preventDefault()
                    setIsComputerFocused(false)
                    return
                }
                if (
                    !isTyping &&
                    (e.code === 'KeyE' ||
                        e.key === 'e' ||
                        e.key === 'E' ||
                        e.key === 'у' ||
                        e.key === 'У')
                ) {
                    e.preventDefault()
                    setIsComputerFocused(false)
                    return
                }
            }

            if (isScreenFocused) {
                if (
                    e.code === 'KeyE' ||
                    e.key === 'e' ||
                    e.key === 'E' ||
                    e.key === 'у' ||
                    e.key === 'У' ||
                    e.code === 'Escape'
                ) {
                    e.preventDefault()
                    setIsScreenFocused(false)
                    return
                }
            }

            if (isTyping) return

            if (keys.current[e.code] !== undefined) keys.current[e.code] = true
            if (e.shiftKey) keys.current.ShiftLeft = true
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (keys.current[e.code] !== undefined) keys.current[e.code] = false
            if (!e.shiftKey) {
                keys.current.ShiftLeft = false
                keys.current.ShiftRight = false
            }
        }
        const handleBlur = () => {
            Object.keys(keys.current).forEach((k) => {
                keys.current[k] = false
            })
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('blur', handleBlur)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('blur', handleBlur)
        }
    }, [isScreenFocused, setIsScreenFocused, isComputerFocused, setIsComputerFocused, isRadioFocused, setIsRadioFocused])

    useFrame((_, delta) => {
        if (!body.current) return

        const translation = body.current.translation()

        if (translation.y < -2) {
            body.current.setTranslation({ x: -0.15, y: 1.2, z: 2.8 }, true)
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            return
        }

        // Позиция глаз игрока в обычном режиме
        const playerEyePos = new THREE.Vector3(translation.x, translation.y + 1.22, translation.z)

        // Плавная анимация фокуса камеры на проекционный экран
        const screenTarget = isScreenFocused ? 1.0 : 0.0
        screenFocusProgress.current = THREE.MathUtils.damp(
            screenFocusProgress.current,
            screenTarget,
            isScreenFocused ? 3.5 : 4.5,
            delta
        )

        // Плавная анимация фокуса камеры на компьютер / монитор
        const computerTarget = isComputerFocused ? 1.0 : 0.0
        computerFocusProgress.current = THREE.MathUtils.damp(
            computerFocusProgress.current,
            computerTarget,
            isComputerFocused ? 3.8 : 4.8,
            delta
        )

        // Плавная анимация фокуса камеры на радиоприемник
        const radioTarget = isRadioFocused ? 1.0 : 0.0
        radioFocusProgress.current = THREE.MathUtils.damp(
            radioFocusProgress.current,
            radioTarget,
            isRadioFocused ? 3.8 : 4.8,
            delta
        )

        // Всегда гарантируем строго горизонтальный уровень камеры (без крена и завала горизонта)
        camera.rotation.order = 'YXZ'
        camera.rotation.z = 0

        if (computerFocusProgress.current > 0.001) {
            camera.position.lerpVectors(playerEyePos, computerTargetPos, computerFocusProgress.current)
            const t = THREE.MathUtils.clamp(delta * 6 * computerFocusProgress.current, 0, 1)
            camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, t)
            camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, Math.PI / 2, t)
            camera.rotation.z = 0
        } else if (screenFocusProgress.current > 0.001) {
            camera.position.lerpVectors(playerEyePos, screenTargetPos, screenFocusProgress.current)
            // Плавный поворот к экрану строго по горизонтали без наклона
            const t = THREE.MathUtils.clamp(delta * 6 * screenFocusProgress.current, 0, 1)
            camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, t)
            camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -Math.PI / 2, t)
            camera.rotation.z = 0
        } else if (radioFocusProgress.current > 0.001) {
            camera.position.lerpVectors(playerEyePos, radioTargetPos, radioFocusProgress.current)
            const t = THREE.MathUtils.clamp(delta * 6 * radioFocusProgress.current, 0, 1)
            camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -0.192, t)
            camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -0.507, t)
            camera.rotation.z = 0
        } else {
            camera.position.copy(playerEyePos)
            camera.rotation.z = 0
        }

        // При фокусировке на экране, мониторе или радио отключаем перемещение игрока
        if (isScreenFocused || isComputerFocused || isRadioFocused) {
            const currentVelocity = body.current.linvel()
            body.current.setLinvel({ x: 0, y: currentVelocity.y, z: 0 }, true)
            return
        }

        if (!isLocked) return

        camera.getWorldDirection(forwardVec)
        forwardVec.y = 0
        forwardVec.normalize()

        rightVec.crossVectors(forwardVec, upVec).normalize()

        const isMovingForward = keys.current.KeyW || keys.current.ArrowUp
        const isMovingBackward = keys.current.KeyS || keys.current.ArrowDown
        const isMovingLeft = keys.current.KeyA || keys.current.ArrowLeft
        const isMovingRight = keys.current.KeyD || keys.current.ArrowRight

        const moveZ = Number(isMovingForward) - Number(isMovingBackward)
        const moveX = Number(isMovingRight) - Number(isMovingLeft)
        const hasMovement = moveZ !== 0 || moveX !== 0

        const isSprinting = (keys.current.ShiftLeft || keys.current.ShiftRight) && hasMovement
        const targetSpeed = isSprinting ? SPRINT_SPEED : WALK_SPEED
        // Плавное ускорение при нажатии Shift и мягкое возвращение к скорости ходьбы
        currentSpeed.current = THREE.MathUtils.damp(currentSpeed.current, targetSpeed, 10, delta)

        directionVec.set(0, 0, 0)
        if (hasMovement) {
            directionVec
                .addScaledVector(forwardVec, moveZ)
                .addScaledVector(rightVec, moveX)
                .normalize()
                .multiplyScalar(currentSpeed.current)
        }

        const currentVelocity = body.current.linvel()
        body.current.setLinvel(
            { x: directionVec.x, y: currentVelocity.y, z: directionVec.z },
            true
        )
    })

    return (
        <RigidBody
            ref={body}
            colliders={false}
            mass={1}
            type="dynamic"
            position={[-0.15, 1.2, 2.8]}
            enabledRotations={[false, false, false]}
            linearDamping={0.5}
            ccd
        >
            <CapsuleCollider args={[0.75, 0.3]} position={[0, 0.95, 0]} />
        </RigidBody>
    )
}