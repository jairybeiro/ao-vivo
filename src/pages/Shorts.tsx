import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronUp, ChevronDown, Heart, Share2, Volume2, VolumeX, Play } from "lucide-react";
import Hls from "hls.js";
import { isHlsUrl } from "@/lib/hlsUtils";

interface Short {
  id: string;
  title: string;
  cover_url: string | null;
  media_url: string;
}

const ShortItem = ({ short, active, muted, onToggleMute }: { short: Short; active: boolean; muted: boolean; onToggleMute: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.playsInline = true;
    const url = short.media_url;

    if (isHlsUrl(url) && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(v);
    } else {
      v.src = url;
      v.load();
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [short.media_url, muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().then(() => setPaused(false)).catch(() => setPaused(true));
    } else {
      v.pause();
    }
  }, [active]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); }
    else { v.pause(); setPaused(true); }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: short.title, url });
      else { await navigator.clipboard.writeText(url); }
    } catch {}
  };

  return (
    <div className="snap-start relative h-[100dvh] w-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        poster={short.cover_url ?? undefined}
        loop
        playsInline
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Bottom title gradient */}
      <div className="absolute bottom-0 left-0 right-20 p-4 pb-24 md:pb-8 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-sm font-medium line-clamp-3">{short.title}</p>
      </div>

      {/* Mute toggle top-right */}
      <button
        onClick={onToggleMute}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
};

const Shorts = () => {
  const navigate = useNavigate();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shorts")
        .select("id, title, cover_url, media_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setShorts(data ?? []);
      setLoading(false);
    })();
  }, []);

  const scrollTo = useCallback((index: number) => {
    const c = containerRef.current;
    if (!c) return;
    const next = Math.max(0, Math.min(shorts.length - 1, index));
    c.scrollTo({ top: next * c.clientHeight, behavior: "smooth" });
  }, [shorts.length]);

  const onScroll = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const idx = Math.round(c.scrollTop / c.clientHeight);
    setActiveIndex(idx);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") scrollTo(activeIndex + 1);
      else if (e.key === "ArrowUp") scrollTo(activeIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, scrollTo]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/60 text-sm">Carregando shorts...</div>;
  }

  if (shorts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/70 gap-4 p-6">
        <p className="text-sm">Nenhum short publicado ainda.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">Voltar</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Vertical snap scroller */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {shorts.map((s, i) => (
          <ShortItem
            key={s.id}
            short={s}
            active={i === activeIndex}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
          />
        ))}
      </div>

      {/* Action sidebar (like, share, up/down) */}
      <div className="absolute right-3 bottom-24 md:bottom-10 z-30 flex flex-col items-center gap-5">
        <button
          onClick={() => {}}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Curtir</span>
        </button>

        <button
          onClick={async () => {
            const url = window.location.href;
            try {
              if (navigator.share) await navigator.share({ title: shorts[activeIndex]?.title ?? "Short", url });
              else await navigator.clipboard.writeText(url);
            } catch {}
          }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Compartilhar</span>
        </button>

        <div className="h-px w-8 bg-white/20" />

        <button
          onClick={() => scrollTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30"
          aria-label="Short anterior"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => scrollTo(activeIndex + 1)}
          disabled={activeIndex >= shorts.length - 1}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30"
          aria-label="Pr\u00f3ximo short"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <span className="text-[10px] text-white/60 font-medium">{activeIndex + 1}/{shorts.length}</span>
      </div>
    </div>
  );
};

export default Shorts;