import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VodPlayer from "@/components/VodPlayer";
import type { VodMovie } from "@/hooks/useVod";

const VodMoviePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<VodMovie | null>(null);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Filme não encontrado</p>
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
        onBack={() => navigate("/vod")}
      />
    </div>
  );
};

export default VodMoviePlayer;
