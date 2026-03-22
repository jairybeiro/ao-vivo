import { useState, useEffect } from "react";

interface NetflixLoaderProps {
  visible: boolean;
  /** When transitioning out, fade duration in ms */
  fadeDuration?: number;
}

/**
 * Netflix-style preload overlay with red circular spinner.
 * Shows on black background while video is loading/buffering.
 * Fades out smoothly when video is ready.
 */
export const NetflixLoader = ({ visible, fadeDuration = 500 }: NetflixLoaderProps) => {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // Keep rendered during fade-out, then unmount
      const timer = setTimeout(() => setShouldRender(false), fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, fadeDuration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundColor: "#141414",
        transitionDuration: `${fadeDuration}ms`,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Logo / Brand text */}
      <div className="mb-8 text-white/80 text-lg font-semibold tracking-widest uppercase select-none">
        StreamPlayer
      </div>

      {/* Red circular spinner */}
      <div className="relative w-20 h-20">
        <svg
          className="animate-spin"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="#E50914"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 126"
          />
        </svg>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
};
