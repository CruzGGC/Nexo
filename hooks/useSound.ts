import { useState, useEffect, useCallback, useRef } from 'react'

type SoundType = 'click' | 'hover' | 'start' | 'place' | 'rotate' | 'shoot' | 'hit' | 'miss' | 'sink' | 'win' | 'lose'

// Map sound types to file paths (placeholders for now, will need actual files)
const SOUND_MAP: Record<SoundType, string> = {
    click: '/sounds/click.mp3',
    hover: '/sounds/hover.mp3',
    start: '/sounds/start.mp3',
    place: '/sounds/place.mp3',
    rotate: '/sounds/rotate.mp3',
    shoot: '/sounds/shoot.mp3',
    hit: '/sounds/explosion.mp3',
    miss: '/sounds/splash.mp3',
    sink: '/sounds/sink.mp3',
    win: '/sounds/win.mp3',
    lose: '/sounds/lose.mp3',
}

export function useSound() {
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(0.05) // Default 5%
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

    useEffect(() => {
        // Preload sounds
        Object.entries(SOUND_MAP).forEach(([key, src]) => {
            const audio = new Audio(src)
            audio.volume = volume
            audioRefs.current[key] = audio
        })
    }, [volume])

    useEffect(() => {
        // Update volume for all sounds
        Object.values(audioRefs.current).forEach(audio => {
            audio.volume = volume
        })
    }, [volume])

    const playSound = useCallback((type: SoundType) => {
        if (isMuted) return

        const audio = audioRefs.current[type]
        if (audio) {
            audio.currentTime = 0
            audio.play().catch(e => console.warn('Audio play failed:', e))
        }
    }, [isMuted])

    const toggleMute = () => setIsMuted(prev => !prev)

    return {
        playSound,
        isMuted,
        toggleMute,
        volume,
        setVolume
    }
}
