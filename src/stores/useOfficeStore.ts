import { create } from 'zustand'

interface OfficeState {
    activeInteraction: string | null
    isLocked: boolean
    isRadioPlaying: boolean
    isRoomLightOn: boolean
    isLampOn: boolean
    selectedCaseId: number | null
    isProjectorOn: boolean
    isScreenFocused: boolean
    isComputerFocused: boolean
    isRadioFocused: boolean
    radioVolume: number
    radioStationIndex: number
    isAppLoaded: boolean
    hasEntered: boolean
    setActiveInteraction: (id: string | null) => void
    setIsLocked: (locked: boolean) => void
    setIsAppLoaded: (loaded: boolean) => void
    setHasEntered: (entered: boolean) => void
    toggleRadio: () => void
    setRadioPlaying: (playing: boolean) => void
    toggleRoomLight: () => void
    setRoomLight: (on: boolean) => void
    toggleLamp: () => void
    setLampOn: (on: boolean) => void
    setSelectedCase: (id: number | null) => void
    toggleProjector: () => void
    setProjectorOn: (on: boolean) => void
    setIsScreenFocused: (focused: boolean) => void
    toggleScreenFocused: () => void
    setIsComputerFocused: (focused: boolean) => void
    toggleComputerFocused: () => void
    setIsRadioFocused: (focused: boolean) => void
    toggleRadioFocused: () => void
    setRadioVolume: (vol: number) => void
    setRadioStationIndex: (idx: number) => void
}

export const useOfficeStore = create<OfficeState>((set) => ({
    activeInteraction: null,
    isLocked: false,
    isRadioPlaying: false,
    isRoomLightOn: true,
    isLampOn: true,
    selectedCaseId: null,
    isProjectorOn: false,
    isScreenFocused: false,
    isComputerFocused: false,
    isRadioFocused: false,
    radioVolume: 0.75,
    radioStationIndex: 0,
    isAppLoaded: false,
    hasEntered: false,
    setActiveInteraction: (id) => set({ activeInteraction: id }),
    setIsLocked: (locked) => set({ isLocked: locked }),
    setIsAppLoaded: (loaded) => set({ isAppLoaded: loaded }),
    setHasEntered: (entered) => set({ hasEntered: entered }),
    toggleRadio: () => set((state) => ({ isRadioPlaying: !state.isRadioPlaying })),
    setRadioPlaying: (playing) => set({ isRadioPlaying: playing }),
    toggleRoomLight: () => set((state) => ({ isRoomLightOn: !state.isRoomLightOn })),
    setRoomLight: (on) => set({ isRoomLightOn: on }),
    toggleLamp: () => set((state) => ({ isLampOn: !state.isLampOn })),
    setLampOn: (on) => set({ isLampOn: on }),
    setSelectedCase: (id) => set({ selectedCaseId: id }),
    toggleProjector: () => set((state) => ({ isProjectorOn: !state.isProjectorOn })),
    setProjectorOn: (on) => set({ isProjectorOn: on }),
    setIsScreenFocused: (focused) => set({ isScreenFocused: focused }),
    toggleScreenFocused: () => set((state) => ({ isScreenFocused: !state.isScreenFocused })),
    setIsComputerFocused: (focused) => set({ isComputerFocused: focused }),
    toggleComputerFocused: () => set((state) => ({ isComputerFocused: !state.isComputerFocused })),
    setIsRadioFocused: (focused) => set({ isRadioFocused: focused }),
    toggleRadioFocused: () => set((state) => ({ isRadioFocused: !state.isRadioFocused })),
    setRadioVolume: (vol) => set({ radioVolume: vol }),
    setRadioStationIndex: (idx) => set({ radioStationIndex: idx }),
}))