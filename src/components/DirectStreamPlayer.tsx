import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";

interface DirectStreamPlayerProps {
  streamUrl: string;
  channelName?: string;
}

const DirectStreamPlayer = ({ streamUrl, channelName = "Test Stream" }: DirectStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    console.log("Loading stream:", streamUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        levelLoadingRetryDelay: 1000,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest loaded");
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.log("Stream error", data);
        if (data.fatal) {
          setError(`Erro fatal: ${data.type} - ${data.details}`);
          setIsLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        console.log("HLS manifest loaded");
        setIsLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        console.log("Stream error", video.error);
        setError("Erro ao carregar stream");
        setIsLoading(false);
      });
    } else {
      setError("Seu navegador não suporta HLS");
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        autoPlay
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-destructive text-sm text-center px-4">{error}</p>
        </div>
      )}
    </div>
  );
};

export default DirectStreamPlayer;
