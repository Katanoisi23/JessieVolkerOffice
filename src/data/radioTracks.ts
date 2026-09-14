// Список треков для радиоприемника.
// Аудиофайлы находятся в папке public/audio/

export interface RadioTrack {
    id: string
    channel: string
    title: string
    url: string
    artist?: string
}

export const RADIO_TRACKS: RadioTrack[] = [
    {
        id: 'track-1',
        channel: 'CH1',
        title: 'Pope Is a Rockstar',
        artist: 'SALES',
        url: '/audio/Sales-PopeIsARockstar.mp3',
    },
    {
        id: 'track-2',
        channel: 'CH2',
        title: 'Cut My Hair',
        artist: 'Mounika.',
        url: '/audio/Mounika-CutMyHair.mp3',
    },
]
