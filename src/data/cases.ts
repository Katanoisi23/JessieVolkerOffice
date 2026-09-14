export interface CaseItem {
    id: number
    title: string
    badge: string
    texture: string
    projectorSlide: string
    col: number
    row: number
    x: number
    y: number
    width: number
    height: number
    rotationZ: number
}

// Данные 6 кейсов на доске в соответствии с референсом пользователя
export const CASE_ITEMS: CaseItem[] = [
    {
        id: 1,
        title: 'GRAFFICO BRAND',
        badge: 'BRANDING',
        texture: '/textures/cases/case_1_brand.svg',
        projectorSlide: '/textures/cases/projector_slide_1.svg',
        col: 0,
        row: 0,
        x: -0.52,
        y: 1.68,
        width: 0.44,
        height: 0.33,
        rotationZ: -0.015,
    },
    {
        id: 2,
        title: 'GRAFFICO 3D',
        badge: 'PUBLIC AWARD',
        texture: '/textures/cases/case_2_cover.svg',
        projectorSlide: '/textures/cases/projector_slide_2.svg',
        col: 1,
        row: 0,
        x: 0.0,
        y: 1.68,
        width: 0.33,
        height: 0.44,
        rotationZ: 0.01,
    },
    {
        id: 3,
        title: 'JURY EVALUATION',
        badge: 'SCORE 7.93',
        texture: '/textures/cases/case_3_jury.svg',
        projectorSlide: '/textures/cases/projector_slide_3.svg',
        col: 2,
        row: 0,
        x: 0.52,
        y: 1.68,
        width: 0.42,
        height: 0.33,
        rotationZ: -0.008,
    },
    {
        id: 4,
        title: 'SITE OF THE DAY',
        badge: 'ANNOUNCEMENT',
        texture: '/textures/cases/case_4_social.svg',
        projectorSlide: '/textures/cases/projector_slide_4.svg',
        col: 0,
        row: 1,
        x: -0.52,
        y: 1.18,
        width: 0.33,
        height: 0.44,
        rotationZ: 0.012,
    },
    {
        id: 5,
        title: 'AWARDS',
        badge: 'UI SHOWCASE',
        texture: '/textures/cases/case_5_showcase.svg',
        projectorSlide: '/textures/cases/projector_slide_5.svg',
        col: 1,
        row: 1,
        x: 0.0,
        y: 1.18,
        width: 0.44,
        height: 0.33,
        rotationZ: -0.006,
    },
    {
        id: 6,
        title: 'HONORABLE MENTION',
        badge: 'CERTIFICATE',
        texture: '/textures/cases/case_6_award.svg',
        projectorSlide: '/textures/cases/projector_slide_6.svg',
        col: 2,
        row: 1,
        x: 0.52,
        y: 1.18,
        width: 0.44,
        height: 0.33,
        rotationZ: 0.016,
    },
]
