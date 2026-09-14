import { EffectComposer, Bloom, Vignette, HueSaturation, BrightnessContrast, SMAA } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function PostEffects() {
    return (
        <EffectComposer enableNormalPass={false} multisampling={0}>
            {/* 1. Деликатное свечение только активных ламп и экранов */}
            <Bloom
                luminanceThreshold={0.88}
                luminanceSmoothing={0.2}
                intensity={0.2}
                mipmapBlur
            />

            {/* 2. Спокойный естественный цветовой баланс */}
            <HueSaturation
                hue={0.0}
                saturation={0.0}
            />

            <BrightnessContrast
                brightness={-0.02}
                contrast={0.08}
            />

            {/* 3. Кинематографичная виньетка по краям экрана */}
            <Vignette
                offset={0.3}
                darkness={0.45}
                blendFunction={BlendFunction.NORMAL}
            />

            {/* 4. Высококачественное сглаживание субпиксельных граней (SMAA) */}
            <SMAA />
        </EffectComposer>
    )
}

