import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useOfficeStore } from '../../stores/useOfficeStore'

const MOVE_SPEED = 4.0

export function Player() {
    const body = useRef<RapierRigidBody>(null)
    const { camera } = useThree()
    const isLocked = useOfficeStore((state) => state.isLocked)

    const keys = useRef<{ [key: string]: boolean }>({
        KeyW: false,
        KeyS: false,
        KeyA: false,
        KeyD: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (keys.current[e.code] !== undefined) keys.current[e.code] = true
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (keys.current[e.code] !== undefined) keys.current[e.code] = false
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    useFrame(() => {
        if (!body.current) return

        const translation = body.current.translation()

        if (translation.y < -2) {
            body.current.setTranslation({ x: 0, y: 1.5, z: 1.0 }, true)
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            return
        }

        // Высота взгляда на уровне 1.82м
        camera.position.set(translation.x, translation.y + 1.22, translation.z)

        if (!isLocked) return

        const forward = new THREE.Vector3()
        camera.getWorldDirection(forward)
        forward.y = 0
        forward.normalize()

        const right = new THREE.Vector3()
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

        const isMovingForward = keys.current.KeyW || keys.current.ArrowUp
        const isMovingBackward = keys.current.KeyS || keys.current.ArrowDown
        const isMovingLeft = keys.current.KeyA || keys.current.ArrowLeft
        const isMovingRight = keys.current.KeyD || keys.current.ArrowRight

        const moveZ = Number(isMovingForward) - Number(isMovingBackward)
        const moveX = Number(isMovingRight) - Number(isMovingLeft)

        const direction = new THREE.Vector3()
        if (moveZ !== 0 || moveX !== 0) {
            direction
                .addScaledVector(forward, moveZ)
                .addScaledVector(right, moveX)
                .normalize()
                .multiplyScalar(MOVE_SPEED)
        }

        const currentVelocity = body.current.linvel()
        body.current.setLinvel(
            { x: direction.x, y: currentVelocity.y, z: direction.z },
            true
        )
    })

    return (
        <RigidBody
            ref={body}
            colliders={false}
            mass={1}
            type="dynamic"
            position={[0, 1.2, 1.0]}
            enabledRotations={[false, false, false]}
            linearDamping={0.5}
        >
            <CapsuleCollider args={[0.75, 0.4]} position={[0, 0.95, 0]} />
        </RigidBody>
    )
}