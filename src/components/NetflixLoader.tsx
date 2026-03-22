import { useState, useEffect } from "react";

interface NetflixLoaderProps {
  visible: boolean;
  /** Poster/cover image to show blurred behind spinner */
  poster?: string;
  /** Fade-out duration in ms */
  fadeDuration?: number;
}

/**
 * Netflix-style loading overlay with blurred poster background
 * and the official Netflix spinner animation.
 */
export const NetflixLoader = ({ visible, poster, fadeDuration = 300 }: NetflixLoaderProps) => {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, fadeDuration]);

  if (!shouldRender) return null;

  return (
    <div
      className="watch-video--loading-view"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "#141414",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeDuration}ms ease-out`,
      }}
    >
      {/* Blurred poster background */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden
          className="player-loading-background-image"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(20px) brightness(0.4)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.3s ease-out",
          }}
        />
      )}

      {/* Netflix spinner */}
      <div
        className="nf-loading-spinner"
        style={{
          position: "absolute",
          margin: "auto",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "7vh",
          height: "7vh",
          backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/common/site-spinner-240.png')",
          backgroundSize: "100%",
          animation: "nf_load_spinner 0.9s linear infinite",
        }}
      />
    </div>
  );
};
