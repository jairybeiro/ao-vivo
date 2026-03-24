import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import VodPlayer from "@/components/VodPlayer";
import { ArrowLeft, Film } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContinueWatching } from "@/hooks/useWatchProgress";
import MobileMovieCatalog from "@/components/vod/MobileMovieCatalog";
import DesktopMovieCatalog from "@/components/vod/DesktopMovieCatalog";
import type { VodMovie } from "@/hooks/useVod";

const VodMoviePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [movie, setMovie] = useState<VodMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState<VodMovie[]>([]);

  const { items: continueWatching } = useContinueWatching();

  useEffect(() => {
    if (!id) return;
    const fetchMovie = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("vod_movies")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        const m: VodMovie = {
          id: data.id,
          name: data.name,
          category: data.category,
          stream_url: data.stream_url,
          cover_url: data.cover_url,
          backdrop_url: (data as any).backdrop_url || null,
          rating: data.rating,
        };
        setMovie(m);
        setNotFound(false);
        // Fetch related movies from same category
        fetchRelated(data.category, data.id);
      } else {
        setNotFound(true);
        cleanupStaleProgress(id);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id]);

  const fetchRelated = async (category: string, excludeId: string) => {
    const { data } = await supabase
      .from("vod_movies")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .neq("id", excludeId)
      .order("name")
      .limit(30);
    if (data) {
      setRelatedMovies(
        data.map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          stream_url: m.stream_url,
          cover_url: m.cover_url,
          backdrop_url: m.backdrop_url || null,
          rating: m.rating,
        }))
      );
    }
  };

  const cleanupStaleProgress = async (contentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase
        .from("user_watch_progress")
        .delete()
        .eq("user_id", session.user.id)
        .eq("content_id", contentId)
        .eq("content_type", "movie");
    } catch {
      // silent fail
    }
  };

  const handlePlayMovie = useCallback((m: VodMovie) => {
    setCatalogOpen(false);
    navigate(`/vod/movie/${m.id}`, { replace: true });
  }, [navigate]);

  const handleContinue = useCallback((item: any) => {
    setCatalogOpen(false);
    if (item.content_type === "movie") {
      navigate(`/vod/movie/${item.content_id}`, { replace: true });
    }
  }, [navigate]);

  // Episodes icon reused from VodPlayer
  const CatalogIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="6" y="5" width="12" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="8" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <polygon points="10,12 10,18 15.5,15" fill="currentColor" />
    </svg>
  );

  const catalogButton = (
    <button
      onClick={(e) => { e.stopPropagation(); setCatalogOpen(prev => !prev); }}
      className="hover:scale-110 transition active:scale-95"
      title="Mais filmes"
    >
      <CatalogIcon />
    </button>
  );

  const catalogOverlay = movie ? (
    isMobile ? (
      <MobileMovieCatalog
        currentMovieId={movie.id}
        movies={relatedMovies}
        continueWatching={continueWatching.filter(cw => cw.content_type === "movie")}
        onPlayMovie={handlePlayMovie}
        onContinue={handleContinue}
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        categoryLabel={movie.category}
      />
    ) : (
      <DesktopMovieCatalog
        currentMovieId={movie.id}
        movies={relatedMovies}
        continueWatching={continueWatching.filter(cw => cw.content_type === "movie")}
        onPlayMovie={handlePlayMovie}
        onContinue={handleContinue}
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        categoryLabel={movie.category}
      />
    )
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (notFound || !movie) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Film className="w-12 h-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Este filme não está disponível para reprodução</p>
        <p className="text-muted-foreground/60 text-xs max-w-xs text-center">
          O conteúdo pode ter sido removido, estar em processo de configuração, ou o link de reprodução ainda não foi definido.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <VodPlayer
        src={movie.stream_url}
        title={movie.name}
        subtitle=""
        poster={movie.cover_url || undefined}
        contentType="movie"
        contentId={movie.id}
        contentName={movie.name}
        contentCoverUrl={movie.cover_url}
        onBack={() => navigate("/entretenimento")}
        extraControls={catalogButton}
        overlayContent={catalogOverlay}
      />
    </div>
  );
};

export default VodMoviePlayer;
