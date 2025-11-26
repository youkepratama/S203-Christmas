import React, { useEffect, useRef } from 'react';

const BackgroundAudio: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Try autoplay on mount, retry on first interaction (tap/click/key) if blocked.
  useEffect(() => {
    const attemptPlay = () => {
      const el = audioRef.current;
      if (!el) return;
      el.play().catch(() => {
        const onFirstInteraction = () => {
          el.play().finally(() => {
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

    attemptPlay();
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/last-christmas.mp3"
      autoPlay
      loop
      preload="auto"
      playsInline
    />
  );
};

export default BackgroundAudio;
