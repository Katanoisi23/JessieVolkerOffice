// Аудиодвижок винтажного радиоприемника на базе Web Audio API
// 100% автономный, без внешних сетевых зависимостей, с аутентичным теплым ламповым звуком и винилом

export interface RadioStation {
    id: string
    freq: string
    name: string
    genre: string
    bpm: number
    description: string
    chords: number[][]
    bassNotes: number[]
}

// Пресеты радиостанций с гармониями
export const RADIO_STATIONS: RadioStation[] = [
    {
        id: 'lofi',
        freq: '104.2 FM',
        name: 'Lo-Fi Sunset Lounge',
        genre: 'Lo-Fi Hip-Hop • Chords & Vinyl',
        bpm: 72,
        description: 'Тёплые джазовые аккорды Rhodes, мягкий бас и ностальгический закатный вайб',
        chords: [
            [174.61, 220.0, 261.63, 329.63], // Fmaj7
            [164.81, 196.0, 246.94, 293.66], // Em7
            [146.83, 174.61, 220.0, 261.63], // Dm7
            [130.81, 164.81, 196.0, 246.94], // Cmaj7
        ],
        bassNotes: [87.31, 82.41, 73.42, 65.41],
    },
    {
        id: 'jazz',
        freq: '98.5 FM',
        name: 'Midnight Vinyl Jazz',
        genre: 'Classic Noir • Smooth Jazz',
        bpm: 64,
        description: 'Глубокие минорные нонаккорды ночного нью-йоркского джаз-клуба',
        chords: [
            [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
            [98.0, 174.61, 246.94, 329.63],          // G13
            [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9
            [110.0, 174.61, 277.18, 349.23],         // A7#5
        ],
        bassNotes: [73.42, 98.0, 65.41, 55.0],
    },
    {
        id: 'soul',
        freq: '91.0 FM',
        name: 'Vintage 70s Soul',
        genre: 'Warm Soul • Neo-Soul Groove',
        bpm: 84,
        description: 'Золотая эра соула 70-х годов: винтажный фанковый грув и пленочная сатурация',
        chords: [
            [110.0, 196.0, 261.63, 329.63],  // Am7
            [146.83, 185.0, 261.63, 329.63], // D9
            [98.0, 174.61, 246.94, 293.66],  // G7
            [130.81, 164.81, 246.94, 293.66], // Cmaj9
        ],
        bassNotes: [55.0, 73.42, 98.0, 65.41],
    },
    {
        id: 'chillwave',
        freq: '88.2 FM',
        name: 'Cosmic Chillwave',
        genre: 'Dreamy Synth • Analog Pads',
        bpm: 78,
        description: 'Пространственные аналоговые синтезаторы с глубоким реверберационным эхом',
        chords: [
            [174.61, 261.63, 349.23, 440.0],  // F
            [196.0, 293.66, 392.0, 493.88],   // G
            [220.0, 261.63, 329.63, 440.0],  // Am
            [164.81, 246.94, 329.63, 392.0], // Em
        ],
        bassNotes: [87.31, 98.0, 110.0, 82.41],
    },
]

class RadioAudioEngine {
    private ctx: AudioContext | null = null
    private masterGain: GainNode | null = null
    private filterNode: BiquadFilterNode | null = null
    private vinylGain: GainNode | null = null
    private vinylSource: AudioBufferSourceNode | null = null

    private isPlaying = false
    private currentStationIdx = 0
    private volume = 0.75
    private vinylEnabled = true

    private stepTimer: number | null = null
    private currentStep = 0
    private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = []

    private getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null
        if (!this.ctx) {
            const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            if (AudioCtx) {
                this.ctx = new AudioCtx()
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {})
        }
        return this.ctx
    }

    private initNodes() {
        const ctx = this.getAudioContext()
        if (!ctx) return

        if (!this.masterGain) {
            this.masterGain = ctx.createGain()
            this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime)

            // Теплый ламповый фильтр (1600 Гц среза с легким резонансом для винтажного динамика)
            this.filterNode = ctx.createBiquadFilter()
            this.filterNode.type = 'lowpass'
            this.filterNode.frequency.setValueAtTime(1600, ctx.currentTime)
            this.filterNode.Q.setValueAtTime(1.2, ctx.currentTime)

            this.filterNode.connect(this.masterGain)
            this.masterGain.connect(ctx.destination)
        }
    }

    // Генерация буфера винилового потрескивания и шума иглы
    private createVinylBuffer(): AudioBuffer | null {
        const ctx = this.getAudioContext()
        if (!ctx) return null

        const duration = 4.0 // 4-секундный бесшовный луп
        const sampleRate = ctx.sampleRate
        const length = sampleRate * duration
        const buffer = ctx.createBuffer(1, length, sampleRate)
        const data = buffer.getChannelData(0)

        // Фоновый тихий розовый шум ленты/пластинки
        let b0 = 0, b1 = 0, b2 = 0
        for (let i = 0; i < length; i++) {
            const white = (Math.random() * 2 - 1) * 0.015
            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            data[i] = b0 + b1 + b2

            // Редкие щелчки и треск пылинок на виниле
            if (Math.random() < 0.0006) {
                const clickAmp = (Math.random() * 0.18 + 0.05) * (Math.random() > 0.5 ? 1 : -1)
                data[i] += clickAmp
                if (i + 1 < length) data[i + 1] -= clickAmp * 0.6
                if (i + 2 < length) data[i + 2] += clickAmp * 0.2
            }
        }

        return buffer
    }

    private startVinylLoop() {
        const ctx = this.getAudioContext()
        if (!ctx || !this.filterNode) return

        this.stopVinylLoop()

        const buffer = this.createVinylBuffer()
        if (!buffer) return

        this.vinylSource = ctx.createBufferSource()
        this.vinylSource.buffer = buffer
        this.vinylSource.loop = true

        this.vinylGain = ctx.createGain()
        this.vinylGain.gain.setValueAtTime(this.vinylEnabled ? 0.35 : 0.0, ctx.currentTime)

        this.vinylSource.connect(this.vinylGain)
        this.vinylGain.connect(this.filterNode)
        this.vinylSource.start()
    }

    private stopVinylLoop() {
        if (this.vinylSource) {
            try {
                this.vinylSource.stop()
                this.vinylSource.disconnect()
            } catch {}
            this.vinylSource = null
        }
        if (this.vinylGain) {
            try {
                this.vinylGain.disconnect()
            } catch {}
            this.vinylGain = null
        }
    }

    // Воспроизведение одного музыкального такта гармонии
    private playStep() {
        const ctx = this.getAudioContext()
        if (!ctx || !this.filterNode || !this.isPlaying) return

        const station = RADIO_STATIONS[this.currentStationIdx] || RADIO_STATIONS[0]
        const chordIdx = this.currentStep % station.chords.length
        const chord = station.chords[chordIdx]
        const bassFreq = station.bassNotes[chordIdx]

        const beatSeconds = 60 / station.bpm
        const chordDuration = beatSeconds * 2 // 2 удара на аккорд

        const now = ctx.currentTime

        // 1. Полифонические ноты аккорда
        chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            // Смесь треугольной волны и синусоиды для мягкого лампового звучания пианино/Rhodes
            osc.type = idx % 2 === 0 ? 'triangle' : 'sine'
            // Легкий винтажный хорус / расстройка на несколько центов
            const detune = (idx - 1.5) * 4.5
            osc.frequency.setValueAtTime(freq, now)
            osc.detune.setValueAtTime(detune, now)

            // Атака и плавное затухание (ADSR)
            gain.gain.setValueAtTime(0.001, now)
            gain.gain.linearRampToValueAtTime(0.045, now + 0.06)
            gain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration * 0.95)

            osc.connect(gain)
            gain.connect(this.filterNode!)

            osc.start(now)
            osc.stop(now + chordDuration)

            this.activeVoices.push({ osc, gain })
        })

        // 2. Глубокий теплый аналоговый бас
        if (bassFreq) {
            const bassOsc = ctx.createOscillator()
            const bassGain = ctx.createGain()

            bassOsc.type = 'sine'
            bassOsc.frequency.setValueAtTime(bassFreq, now)

            bassGain.gain.setValueAtTime(0.001, now)
            bassGain.gain.linearRampToValueAtTime(0.08, now + 0.04)
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration * 0.85)

            bassOsc.connect(bassGain)
            bassGain.connect(this.filterNode!)

            bassOsc.start(now)
            bassOsc.stop(now + chordDuration)

            this.activeVoices.push({ osc: bassOsc, gain: bassGain })
        }

        // 3. Мягкий Lo-Fi щелчок метронома / виниловый бит на слабую долю
        const beatOsc = ctx.createOscillator()
        const beatGain = ctx.createGain()
        beatOsc.type = 'triangle'
        beatOsc.frequency.setValueAtTime(95, now)
        beatOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08)
        beatGain.gain.setValueAtTime(0.05, now)
        beatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        beatOsc.connect(beatGain)
        beatGain.connect(this.filterNode!)
        beatOsc.start(now)
        beatOsc.stop(now + 0.09)

        this.currentStep++
    }

    // Запуск проигрывателя
    public start(stationIndex?: number) {
        if (stationIndex !== undefined) {
            this.currentStationIdx = (stationIndex + RADIO_STATIONS.length) % RADIO_STATIONS.length
        }
        this.initNodes()
        this.isPlaying = true

        this.playToggleClick(true)
        this.startVinylLoop()

        if (this.stepTimer) clearInterval(this.stepTimer)

        const station = RADIO_STATIONS[this.currentStationIdx] || RADIO_STATIONS[0]
        const intervalMs = ((60 / station.bpm) * 2) * 1000

        this.currentStep = 0
        this.playStep()

        this.stepTimer = window.setInterval(() => {
            if (this.isPlaying) {
                this.playStep()
            }
        }, intervalMs)
    }

    // Остановка проигрывателя
    public stop() {
        this.isPlaying = false
        this.playToggleClick(false)
        this.stopVinylLoop()

        if (this.stepTimer) {
            clearInterval(this.stepTimer)
            this.stepTimer = null
        }

        // Останавливаем все звучащие голоса
        this.activeVoices.forEach(({ osc, gain }) => {
            try {
                gain.gain.linearRampToValueAtTime(0.001, (this.ctx?.currentTime || 0) + 0.05)
                setTimeout(() => {
                    try {
                        osc.stop()
                        osc.disconnect()
                    } catch {}
                }, 60)
            } catch {}
        })
        this.activeVoices = []
    }

    // Переключение радиостанции
    public setStation(idx: number) {
        const newIdx = (idx + RADIO_STATIONS.length) % RADIO_STATIONS.length
        this.currentStationIdx = newIdx
        this.playTuningStatic()

        if (this.isPlaying) {
            this.start(newIdx)
        }
    }

    public nextStation() {
        this.setStation(this.currentStationIdx + 1)
    }

    public prevStation() {
        this.setStation(this.currentStationIdx - 1)
    }

    // Регулировка громкости
    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol))
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
        }
    }

    // Включение/выключение винилового треска
    public toggleVinyl(enable?: boolean) {
        this.vinylEnabled = enable !== undefined ? enable : !this.vinylEnabled
        if (this.vinylGain && this.ctx) {
            this.vinylGain.gain.setValueAtTime(this.vinylEnabled ? 0.35 : 0.0, this.ctx.currentTime)
        }
        return this.vinylEnabled
    }

    // Звук переключения тумблера питания (тяжелый ретро-щелчок)
    public playToggleClick(turningOn = true) {
        try {
            const ctx = this.getAudioContext()
            if (!ctx) return
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'triangle'
            osc.frequency.setValueAtTime(turningOn ? 320 : 210, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(turningOn ? 80 : 50, ctx.currentTime + 0.04)

            gain.gain.setValueAtTime(0.28, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.05)
        } catch {}
    }

    // Звук перестройки радиочастоты (аналоговый шум эфира)
    public playTuningStatic() {
        try {
            const ctx = this.getAudioContext()
            if (!ctx) return

            const bufferSize = ctx.sampleRate * 0.22
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
            const data = buffer.getChannelData(0)

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.25
            }

            const noise = ctx.createBufferSource()
            noise.buffer = buffer

            const filter = ctx.createBiquadFilter()
            filter.type = 'bandpass'
            filter.frequency.setValueAtTime(1200, ctx.currentTime)
            filter.frequency.linearRampToValueAtTime(2800, ctx.currentTime + 0.1)
            filter.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.22)
            filter.Q.setValueAtTime(3.0, ctx.currentTime)

            const gain = ctx.createGain()
            gain.gain.setValueAtTime(0.18, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

            noise.connect(filter)
            filter.connect(gain)
            gain.connect(ctx.destination)

            noise.start()
        } catch {}
    }

    public getStationIndex() {
        return this.currentStationIdx
    }

    public getIsPlaying() {
        return this.isPlaying
    }

    public getIsVinylEnabled() {
        return this.vinylEnabled
    }
}

export const radioAudio = new RadioAudioEngine()
