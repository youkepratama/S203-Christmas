import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';

const BackgroundAudio: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isOpen, setIsOpen] = useState(true);

  const syncStateFromAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    setIsPlaying(!el.paused);
    setIsMuted(el.muted || el.volume === 0);
    setVolume(el.volume);
  };

  const attemptPlay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = isMuted;
    el.play().then(syncStateFromAudio).catch(() => {
      const onFirstInteraction = () => {
        el.play().finally(() => {
          syncStateFromAudio();
          document.removeEventListener('pointerdown', onFirstInteraction);
          document.removeEventListener('keydown', onFirstInteraction);
          document.removeEventListener('touchstart', onFirstInteraction);
        });
      };
      document.addEventListener('pointerdown', onFirstInteraction, { once: true });
      document.addEventListener('keydown', onFirstInteraction, { once: true });
      document.addEventListener('touchstart', onFirstInteraction, { once: true });
    });
  };

  useEffect(() => {
    attemptPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = isMuted;
    el.addEventListener('play', syncStateFromAudio);
    el.addEventListener('pause', syncStateFromAudio);
    el.addEventListener('volumechange', syncStateFromAudio);
    return () => {
      el.removeEventListener('play', syncStateFromAudio);
      el.removeEventListener('pause', syncStateFromAudio);
      el.removeEventListener('volumechange', syncStateFromAudio);
    };
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(syncStateFromAudio).catch(() => {});
    } else {
      el.pause();
      syncStateFromAudio();
    }
  };

  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !isMuted;
    setIsMuted(el.muted);
    if (!el.muted && el.volume === 0) {
      el.volume = 0.6;
      setVolume(0.6);
    }
  };

  const handleVolumeChange = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    const vol = Math.min(1, Math.max(0, value));
    el.volume = vol;
    setVolume(vol);
    if (vol > 0 && el.muted) {
      el.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <audio
        ref={audioRef}
        src="/last-christmas.mp3"
        autoPlay
        loop
        preload="auto"
        playsInline
      />
      <div className="pointer-events-auto bg-white/90 backdrop-blur rounded-full shadow-lg border border-gray-200 px-2 py-1 flex items-center gap-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
          aria-label={isOpen ? 'Collapse player' : 'Expand player'}
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {isOpen ? (
          <>
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-24 accent-blue-600"
              aria-label="Volume"
            />
          </>
        ) : (
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default BackgroundAudio;
