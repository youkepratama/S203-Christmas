import React, { useEffect, useRef } from 'react';

const BackgroundAudio: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Try autoplay on mount, and on first user interaction if blocked by the browser.
  useEffect(() => {
    const attemptPlay = () => {
      const el = audioRef.current;
      if (!el) return;
      el.play().catch(() => {
        // If blocked, wait for first user interaction to retry.
        const onFirstInteraction = () => {
          el.play().finally(() => {
            document.removeEventListener('pointerdown', onFirstInteraction);
            document.removeEventListener('keydown', onFirstInteraction);
          });
        };
        document.addEventListener('pointerdown', onFirstInteraction, { once: true });
        document.addEventListener('keydown', onFirstInteraction, { once: true });
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
    />
  );
};

export default BackgroundAudio;
