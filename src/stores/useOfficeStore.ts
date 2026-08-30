import { create } from 'zustand'

interface OfficeState {
    activeInteraction: string | null
    isLocked: boolean
    isRadioPlaying: boolean
    setActiveInteraction: (id: string | null) => void
    setIsLocked: (locked: boolean) => void
    toggleRadio: () => void
}

export const useOfficeStore = create<OfficeState>((set) => ({
    activeInteraction: null,
    isLocked: false,
    isRadioPlaying: false,
    setActiveInteraction: (id) => set({ activeInteraction: id }),
    setIsLocked: (locked) => set({ isLocked: locked }),
    toggleRadio: () => set((state) => ({ isRadioPlaying: !state.isRadioPlaying })),
}))