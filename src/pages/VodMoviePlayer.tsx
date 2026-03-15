import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toProxyStreamUrl } from "@/lib/streamProxy";
import type { VodMovie } from "@/hooks/useVod";

const VodMoviePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<VodMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
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
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Filme não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-background/80 backdrop-blur-sm p-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h1 className="text-sm font-medium text-foreground truncate">{movie.name}</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          src={movie.stream_url}
          controls
          autoPlay
          className="w-full max-h-[calc(100vh-56px)]"
          poster={movie.cover_url || undefined}
        />
      </div>
    </div>
  );
};

export default VodMoviePlayer;
