import { useState, useRef, useEffect } from "react";
import { Star, PlayCircle, X } from "lucide-react";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
import { Briefcase } from "lucide-react";
import { createPortal } from "react-dom";

interface CineBusinessCardPopoverProps {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  sinopse: string | null;
  onClick: () => void;
  onPlayTrailer: (trailerUrl: string) => void;
}

const CineBusinessCardPopover = ({
  id,
  name,
  category,
  cover_url,
  backdrop_url,
  rating,
  trailer_url,
  sinopse,
  onClick,
  onPlayTrailer,
}: CineBusinessCardPopoverProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Determinar se há trailer disponível
  const hasTrailer = trailer_url && (trailer_url.includes("youtube") || trailer_url.includes("youtu.be") || trailer_url.endsWith(".mp4") || trailer_url.includes(".m3u8"));

  // Calcular posição do popover
  useEffect(() => {
    if (isHovering && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const popoverWidth = 400;
      const popoverHeight = 500;

      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      let top = rect.top - popoverHeight - 10;

      // Ajustar se sair da tela
      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }
      if (top < 10) {
        top = rect.bottom + 10;
      }

      setPopoverPosition({ top, left });
    }
  }, [isHovering]);

  return (
    <>
      {/* Card Original */}
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="cursor-pointer h-full"
      >
        <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative transition-all duration-300 shadow-lg hover:shadow-xl">
          {/* Cover Image */}
          {cover_url ? (
            <img
              src={cover_url}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Briefcase className="w-8 h-8 text-amber-500" />
            </div>
          )}

          {/* Rating Badge */}
          {rating && rating > 0 && (
            <div className="absolute top-1.5 right-1.5 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {rating}
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="mt-2 cursor-pointer" onClick={onClick}>
          <p className="text-xs font-medium truncate text-foreground">{name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{category}</p>
        </div>
      </div>

      {/* Popover Modal Netflix Style */}
      {isHovering &&
        createPortal(
          <div
            className="fixed z-[9998] pointer-events-none"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="w-96 bg-[#141414] rounded-lg overflow-hidden shadow-2xl border border-white/10 pointer-events-auto">
              {/* Video Preview */}
              <div className="aspect-video bg-black relative overflow-hidden">
                {hasTrailer ? (
                  <div className="w-full h-full">
                    {trailer_url?.includes("youtube") || trailer_url?.includes("youtu.be") ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${
                          trailer_url.includes("v=")
                            ? trailer_url.split("v=")[1]
                            : trailer_url.split("/").pop()
                        }?autoplay=1&mute=1&controls=0&loop=1`}
                        className="w-full h-full"
                        allow="autoplay"
                      />
                    ) : (
                      <HlsAutoplayVideo
                        src={trailer_url}
                        poster={backdrop_url}
                        delayMs={0}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                    <Briefcase className="w-12 h-12 text-amber-500" />
                  </div>
                )}

                {/* Play Button Overlay */}
                {hasTrailer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrailer(trailer_url!);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group"
                  >
                    <PlayCircle className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Content Info */}
              <div className="p-4 space-y-3">
                {/* Title and Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white line-clamp-2">{name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{category}</p>
                  </div>
                  {rating && rating > 0 && (
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-semibold">{rating}</span>
                    </div>
                  )}
                </div>

                {/* Sinopse */}
                {sinopse && (
                  <p className="text-xs text-gray-300 line-clamp-2">{sinopse}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    className="flex-1 bg-white text-black font-semibold py-2 rounded hover:bg-white/80 transition-colors text-xs"
                  >
                    Ver Detalhes
                  </button>
                  {hasTrailer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrailer(trailer_url!);
                      }}
                      className="flex-1 bg-white/20 text-white font-semibold py-2 rounded hover:bg-white/30 transition-colors text-xs flex items-center justify-center gap-1"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Trailer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CineBusinessCardPopover;
