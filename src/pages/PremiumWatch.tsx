import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumContent, type PremiumContent } from "@/hooks/usePremiumContent";
import EmbedPlayer from "@/components/EmbedPlayer";
import VideoPlayer from "@/components/VideoPlayer";
import { VerticalVideoContainer } from "@/components/vertical";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tv } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { hasValidStreamUrls, isHlsUrl } from "@/lib/hlsUtils";

const PremiumWatch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { content, loading } = usePremiumContent();
  const [currentContent, setCurrentContent] = useState<PremiumContent | null>(null);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const isMobile = useIsMobile();

  // Redirecionamento agora é feito pelo ProtectedRoute

  useEffect(() => {
    if (!loading && id) {
      const found = content.find((c) => c.id === id);
      setCurrentContent(found || null);
    }
  }, [content, loading, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!currentContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Tv className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Conteúdo não encontrado</h2>
        <Button onClick={() => navigate("/premium")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-3 md:px-4 py-2 md:py-4 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/premium")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base md:text-xl font-bold text-foreground line-clamp-1">
              {currentContent.title}
            </h1>
            {currentContent.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 hidden md:block">
                {currentContent.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Player */}
      <main className="flex-1 flex items-center justify-center p-3 md:p-6">
        <div className={`w-full ${isVerticalVideo ? 'max-w-md' : 'max-w-6xl'}`}>
          {currentContent.embedUrl ? (
            <EmbedPlayer
              embedUrl={currentContent.embedUrl}
              channelName={currentContent.title}
            />
          ) : hasValidStreamUrls(currentContent.streamUrls) ? (
            <VideoPlayer
              streamUrls={currentContent.streamUrls.filter(url => url.includes(".m3u8"))}
              channelName={currentContent.title}
              isVertical={isVerticalVideo}
              onAspectRatioDetected={(isVertical) => setIsVerticalVideo(isVertical)}
            />
          ) : (
            <div className="aspect-video bg-card rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Tv className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-2 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  URL de stream não configurada
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PremiumWatch;
