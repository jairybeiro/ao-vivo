import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VodPlayer from "@/components/VodPlayer";
import { ArrowLeft, Film } from "lucide-react";
import type { VodMovie } from "@/hooks/useVod";

const VodMoviePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<VodMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchMovie = async () => {
      const { data, error } = await supabase
        .from("vod_movies")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        setMovie({
          id: data.id,
          name: data.name,
          category: data.category,
          stream_url: data.stream_url,
          cover_url: data.cover_url,
          rating: data.rating,
        });
      } else {
        setNotFound(true);
        // Clean up stale watch progress for this missing movie
        cleanupStaleProgress(id);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id]);

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
        <p className="text-muted-foreground">Este filme não está mais disponível</p>
        <p className="text-muted-foreground/60 text-xs max-w-xs text-center">
          O conteúdo pode ter sido removido ou atualizado pelo provedor.
        </p>
        <button
          onClick={() => navigate("/vod")}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black">
      <VodPlayer
        src={movie.stream_url}
        title={movie.name}
        subtitle={movie.category}
        poster={movie.cover_url || undefined}
        contentType="movie"
        contentId={movie.id}
        contentName={movie.name}
        contentCoverUrl={movie.cover_url}
        onBack={() => navigate("/vod")}
      />
    </div>
  );
};

export default VodMoviePlayer;
