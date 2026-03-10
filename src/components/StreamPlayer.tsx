import { useRef, forwardRef } from "react";
import { useStreamPlayer } from "@/hooks/useStreamPlayer";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreamPlayerComponentProps {
  source: string;
  sources?: string[];
  title?: string;
  fallbackEmbedUrl?: string;
  debug?: boolean;
}

const StreamPlayerComponent = forwardRef<HTMLDivElement, StreamPlayerComponentProps>(
  ({ source, sources, title, fallbackEmbedUrl, debug = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { state, error, reload, resolvedSource } = useStreamPlayer({
      source,
      sources,
      containerRef: containerRef as React.RefObject<HTMLElement>,
      title,
      fallbackEmbedUrl,
      debug,
    });

    return (
      <div ref={ref} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />

        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive text-sm text-center px-4">
              {error?.details || "Erro ao carregar stream"}
            </p>
            <Button variant="outline" size="sm" onClick={reload} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {debug && resolvedSource && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 font-mono">
            {resolvedSource.type} | {resolvedSource.resolvedUrl.substring(0, 60)}...
          </div>
        )}
      </div>
    );
  }
);

StreamPlayerComponent.displayName = "StreamPlayerComponent";

export default StreamPlayerComponent;
