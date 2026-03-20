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

interface LastWatched {
  content_id: string;
  content_type: "movie" | "episode";
  content_name: string;
  content_cover_url: string | null;
  current_time_secs: number;
  duration_secs: number;
}

interface ContentDetails {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  stream_url: string;
  rating: number | null;
  plot: string | null;
  type: "movie" | "series";
  series_id?: string;
}

const HeroBanner = ({ movies, series, activeTab }: HeroBannerProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mountedRef = useRef(true);

  const [isPreviewing, setIsPreviewing] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [lastWatched, setLastWatched] = useState<LastWatched | null>(null);
  const [tmdbBackdrop, setTmdbBackdrop] = useState<string | null>(null);
  const [tmdbPlot, setTmdbPlot] = useState<string | null>(null);
  

  // 1. Fetch last watched content
  useEffect(() => {
    const fetchLastWatched = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Fallback: pick random from current tab
        pickRandom();
        return;
      }

      const { data } = await supabase
        .from("user_watch_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("finished", false)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.current_time_secs > 10) {
        setLastWatched(data as unknown as LastWatched);
      } else {
        pickRandom();
      }
    };

    const pickRandom = () => {
      const candidates = activeTab === "movies"
        ? movies.filter(m => m.cover_url)
        : series.filter(s => s.cover_url);
      if (candidates.length === 0) return;
      const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))];
      const isMovie = activeTab === "movies";
      setContent({
        id: pick.id,
        name: pick.name,
        category: pick.category,
        cover_url: pick.cover_url,
        backdrop_url: (pick as any).backdrop_url || null,
        stream_url: isMovie ? (pick as VodMovie).stream_url : "",
        rating: pick.rating,
        plot: "plot" in pick ? (pick as VodSeries).plot : null,
        type: isMovie ? "movie" : "series",
      });
      setLastWatched(null);
    };

    fetchLastWatched();
  }, [activeTab, movies.length, series.length]);

  // 2. Resolve content details from last watched
  useEffect(() => {
    if (!lastWatched) return;

    const resolve = async () => {
      if (lastWatched.content_type === "movie") {
        const { data: movie } = await supabase
          .from("vod_movies")
          .select("*")
          .eq("id", lastWatched.content_id)
          .maybeSingle();
        if (movie && mountedRef.current) {
          setContent({
            id: movie.id,
            name: movie.name,
            category: movie.category,
            cover_url: movie.cover_url,
            stream_url: movie.stream_url,
            rating: movie.rating,
            plot: null,
            type: "movie",
          });
        }
      } else {
        // Episode → find series
        const { data: episode } = await supabase
          .from("vod_episodes")
          .select("*, vod_series(*)")
          .eq("id", lastWatched.content_id)
          .maybeSingle();
        if (episode && mountedRef.current) {
          const s = (episode as any).vod_series;
          setContent({
            id: episode.id,
            name: s?.name || episode.title,
            category: s?.category || "Séries",
            cover_url: s?.cover_url || episode.cover_url,
            stream_url: episode.stream_url,
            rating: s?.rating || null,
            plot: s?.plot || null,
            type: "series",
            series_id: episode.series_id,
          });
        }
      }
    };
    resolve();
  }, [lastWatched?.content_id]);

  // 3. Fetch TMDB backdrop
  useEffect(() => {
    if (!content) return;
    setTmdbBackdrop(null);
    setTmdbPlot(null);

    const fetchBackdrop = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("tmdb-lookup", {
          body: {
            search_name: content.name,
            type: content.type === "series" ? "series" : "movie",
          },
        });
        if (!error && data && mountedRef.current) {
          setTmdbBackdrop(data.backdrop_url || null);
          if (data.plot && !content.plot) setTmdbPlot(data.plot);
        }
      } catch { /* silent */ }
    };
    fetchBackdrop();
  }, [content?.id]);

  // 4. Attach video & play from 30s before saved position
  useEffect(() => {
    if (!content?.stream_url || !videoRef.current) return;

    const video = videoRef.current;
    const proxied = toProxyStreamUrl(content.stream_url);
    const startTime = lastWatched ? Math.max(0, lastWatched.current_time_secs - 30) : 0;
    const stopTime = lastWatched ? lastWatched.current_time_secs : 30;

    setIsPreviewing(true);
    setVideoReady(false);

    const onCanPlay = () => {
      if (!mountedRef.current) return;
      video.currentTime = startTime;
      video.play().catch(() => {});
      setVideoReady(true);
    };

    const onTimeUpdate = () => {
      if (!mountedRef.current) return;
      if (video.currentTime >= stopTime) {
        video.removeEventListener("timeupdate", onTimeUpdate);
        setIsPreviewing(false);
        video.pause();
      }
    };

    video.addEventListener("canplay", onCanPlay, { once: true });
    video.addEventListener("timeupdate", onTimeUpdate);

    if (isHlsUrl(proxied) && Hls.isSupported()) {
      hlsRef.current?.destroy();
      const hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 30 });
      hls.loadSource(proxied);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = proxied;
      video.load();
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [content?.stream_url, lastWatched?.content_id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handlePlay = useCallback(() => {
    if (!content) return;
    if (content.type === "movie") {
      navigate(`/vod/movie/${content.id}`);
    } else {
      navigate(`/vod/series/${content.series_id || content.id}`);
    }
  }, [content, navigate]);

  if (!content) return null;

  const displayPlot = content.plot || tmdbPlot;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: 320 }}>
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* TMDB backdrop - fades in after video stops */}
        {tmdbBackdrop && (
          <img
            src={tmdbBackdrop}
            alt={content.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-out ${
              videoReady && isPreviewing ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {/* Video */}
        {content.stream_url ? (
          <video
            ref={videoRef}
            muted={muted}
            playsInline
            className={`w-full h-full object-cover transition-all duration-[2000ms] ease-out ${
              !isPreviewing ? "scale-110 opacity-0" : "scale-100 opacity-100"
            }`}
            poster={content.cover_url || undefined}
          />
        ) : (
          content.cover_url && (
            <img
              src={content.cover_url}
              alt={content.name}
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

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-2 md:mb-3 drop-shadow-lg">
            {content.name}
          </h2>

          {/* Rating */}
          {content.rating && content.rating > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 font-bold text-sm">
                {Math.round(content.rating * 10)}% relevante
              </span>
            </div>
          )}

          {/* Plot */}
          {displayPlot && (
            <p className="text-sm md:text-base text-gray-200 mb-4 max-w-lg drop-shadow transition-all duration-[2000ms] line-clamp-5">
              {displayPlot}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 md:px-7 md:py-3 rounded-md hover:bg-white/80 transition-colors text-sm md:text-base"
            >
              <Play className="w-5 h-5 fill-black" />
              {lastWatched ? "Continuar" : "Assistir"}
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

      {/* Mute toggle */}
      {content.stream_url && videoReady && isPreviewing && (
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
