import { useEffect, useRef, useCallback, useState } from "react";
import { StreamPlayer, type PlayerState, type ResolvedSource, type StreamPlayerError } from "@/sdk/StreamPlayerSDK";

interface UseStreamPlayerOptions {
  source: string;
  containerRef: React.RefObject<HTMLElement>;
  autoplay?: boolean;
  title?: string;
  debug?: boolean;
  fallbackEmbedUrl?: string;
  onPlay?: () => void;
  onError?: (error: StreamPlayerError) => void;
  onBuffer?: () => void;
  onReload?: () => void;
  onFallback?: (url: string) => void;
}

export const useStreamPlayer = (options: UseStreamPlayerOptions) => {
  const playerRef = useRef<StreamPlayer | null>(null);
  const [state, setState] = useState<PlayerState>("idle");
  const [resolvedSource, setResolvedSource] = useState<ResolvedSource | null>(null);
  const [error, setError] = useState<StreamPlayerError | null>(null);
  const prevSourceRef = useRef<string>("");

  const { source, containerRef, autoplay = true, title, debug = false, fallbackEmbedUrl } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !source) return;

    // Skip if same source
    if (prevSourceRef.current === source && playerRef.current) return;
    prevSourceRef.current = source;

    // Destroy previous
    playerRef.current?.destroy();
    setError(null);
    setState("loading");

    const player = new StreamPlayer({
      container,
      source,
      autoplay,
      title,
      debug,
      fallbackEmbedUrl,
      onPlay: () => {
        setState("playing");
        options.onPlay?.();
      },
      onError: (err) => {
        setError(err);
        setState("error");
        options.onError?.(err);
      },
      onBuffer: options.onBuffer,
      onReload: options.onReload,
      onFallback: (url) => {
        setState("fallback");
        options.onFallback?.(url);
      },
      onSourceResolved: (src) => setResolvedSource(src),
    });

    playerRef.current = player;
    player.init();

    return () => {
      player.destroy();
      playerRef.current = null;
      prevSourceRef.current = "";
    };
  }, [source]); // Only re-init on source change

  const reload = useCallback(() => playerRef.current?.reload(), []);
  const play = useCallback(() => playerRef.current?.play(), []);
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const setVolume = useCallback((v: number) => playerRef.current?.setVolume(v), []);
  const toggleFullscreen = useCallback(() => playerRef.current?.toggleFullscreen(), []);

  return {
    player: playerRef.current,
    state,
    error,
    resolvedSource,
    reload,
    play,
    pause,
    setVolume,
    toggleFullscreen,
  };
};
