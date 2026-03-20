import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import { isHlsUrl } from "@/lib/hlsUtils";
import { supabase } from "@/integrations/supabase/client";
import Hls from "hls.js";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import type { VodMovie, VodSeries } from "@/hooks/useVod";

interface HeroBannerProps {
  movies: VodMovie[];
  series: VodSeries[];
  activeTab: "movies" | "series";
}

const PREVIEW_DURATION = 15; // seconds before zoom/pause

const HeroBanner = ({ movies, series, activeTab }: HeroBannerProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const playStartRef = useRef(0);
  const mountedRef = useRef(true);

  const [isPreviewing, setIsPreviewing] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [featured, setFeatured] = useState<{
    id: string;
    name: string;
    cover_url: string | null;
    stream_url?: string;
    plot?: string | null;
    category: string;
    rating: number | null;
    type: "movie" | "series";
  } | null>(null);

  // Pick a random featured item with a cover
  useEffect(() => {
    const candidates = activeTab === "movies"
      ? movies.filter(m => m.cover_url).map(m => ({ ...m, type: "movie" as const, plot: null }))
      : series.filter(s => s.cover_url).map(s => ({ ...s, type: "series" as const, stream_url: undefined }));

    if (candidates.length === 0) {
      setFeatured(null);
      return;
    }

    const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))];
    setFeatured(pick);
    setIsPreviewing(true);
    setVideoReady(false);
  }, [activeTab, movies.length, series.length]);

  // For series, fetch first episode stream_url
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!featured) { setStreamUrl(null); return; }

    if (featured.type === "movie" && featured.stream_url) {
      setStreamUrl(featured.stream_url);
    } else if (featured.type === "series") {
      supabase
        .from("vod_episodes")
        .select("stream_url")
        .eq("series_id", featured.id)
        .order("season")
        .order("episode_num")
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (mountedRef.current) setStreamUrl(data?.stream_url || null);
        });
    }
  }, [featured?.id]);

  // Fetch saved watch progress
  const [savedTime, setSavedTime] = useState(0);

  useEffect(() => {
    if (!featured) return;
    const contentType = featured.type === "movie" ? "movie" : "episode";
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("user_watch_progress")
        .select("current_time_secs, finished")
        .eq("user_id", session.user.id)
        .eq("content_type", contentType)
        .eq("content_id", featured.id)
        .maybeSingle()
        .then(({ data }) => {
          if (mountedRef.current && data && !data.finished) {
            setSavedTime(data.current_time_secs || 0);
          } else {
            setSavedTime(0);
          }
        });
    });
  }, [featured?.id]);

  // Attach video
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    const proxied = toProxyStreamUrl(streamUrl);

    // Reset state
    setIsPreviewing(true);
    setVideoReady(false);
    clearTimeout(timerRef.current);

    const onCanPlay = () => {
      if (!mountedRef.current) return;
      if (savedTime > 0) video.currentTime = savedTime;
      video.play().catch(() => {});
      setVideoReady(true);
      playStartRef.current = Date.now();

      // Start 15s timer
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setIsPreviewing(false);
          video.pause();
        }
      }, PREVIEW_DURATION * 1000);
    };

    video.addEventListener("canplay", onCanPlay, { once: true });

    if (isHlsUrl(proxied) && Hls.isSupported()) {
      hlsRef.current?.destroy();
      const hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 20 });
      hls.loadSource(proxied);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = proxied;
      video.load();
    }

    return () => {
      clearTimeout(timerRef.current);
      video.removeEventListener("canplay", onCanPlay);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streamUrl, savedTime]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handlePlay = useCallback(() => {
    if (!featured) return;
    if (featured.type === "movie") {
      navigate(`/vod/movie/${featured.id}`);
    } else {
      navigate(`/vod/series/${featured.id}`);
    }
  }, [featured, navigate]);

  if (!featured) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: 320 }}>
      {/* Background: video or poster fallback */}
      <div className="absolute inset-0">
        {streamUrl ? (
          <video
            ref={videoRef}
            muted={muted}
            playsInline
            className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${
              !isPreviewing ? "scale-110" : "scale-100"
            }`}
            poster={featured.cover_url || undefined}
          />
        ) : (
          featured.cover_url && (
            <img
              src={featured.cover_url}
              alt={featured.name}
              className="w-full h-full object-cover"
            />
          )
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8 md:px-12 md:pb-12 z-10">
        <div
          className={`max-w-xl transition-all duration-[2000ms] ease-out origin-bottom-left ${
            isPreviewing
              ? "opacity-90 translate-y-0 scale-100"
              : "opacity-100 translate-y-0 scale-[1.05] md:scale-110"
          }`}
        >
          {/* Category badge */}
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            {featured.category}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-2 md:mb-3 drop-shadow-lg">
            {featured.name}
          </h2>

          {/* Rating */}
          {featured.rating && featured.rating > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 font-bold text-sm">
                {Math.round(featured.rating * 10)}% relevante
              </span>
            </div>
          )}

          {/* Plot / description */}
          {featured.plot && (
            <p className="text-sm md:text-base text-gray-200 line-clamp-3 mb-4 max-w-lg drop-shadow">
              {featured.plot}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 md:px-7 md:py-3 rounded-md hover:bg-white/80 transition-colors text-sm md:text-base"
            >
              <Play className="w-5 h-5 fill-black" />
              Assistir
            </button>
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-2.5 md:px-7 md:py-3 rounded-md hover:bg-white/30 transition-colors text-sm md:text-base"
            >
              <Info className="w-5 h-5" />
              Mais informações
            </button>
          </div>
        </div>
      </div>

      {/* Mute toggle - bottom right */}
      {streamUrl && videoReady && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute bottom-8 right-6 md:bottom-12 md:right-12 z-20 w-10 h-10 rounded-full border border-white/40 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Age rating badge */}
      <div className="absolute bottom-8 right-20 md:bottom-12 md:right-28 z-20 border-l-2 border-white/50 pl-2">
        <span className="text-white/70 text-xs font-medium">14</span>
      </div>
    </div>
  );
};

export default HeroBanner;
