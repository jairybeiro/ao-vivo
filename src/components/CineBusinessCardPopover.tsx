import { useState, useRef, useEffect } from "react";
import { Star, Play, Plus, ThumbsUp, ChevronDown, Briefcase } from "lucide-react";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
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
  const [showPopover, setShowPopover] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const popoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  // Determinar se há trailer disponível
  const hasTrailer = trailer_url && (trailer_url.includes("youtube") || trailer_url.includes("youtu.be") || trailer_url.endsWith(".mp4") || trailer_url.includes(".m3u8"));

  // Calcular posição do popover para sobrepor o card original
  useEffect(() => {
    if (showPopover && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      
      // O popover começa na mesma posição do card, mas cresce (scale)
      setPopoverPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    }
  }, [showPopover]);

  // Lógica de hover: mostrar popover por 3 segundos
  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowPopover(true);
    setShowPlayIcon(false);

    // Limpar timeout anterior se existir
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
    }

    // Fechar popover após 3 segundos
    popoverTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
      setShowPlayIcon(true); // Mostrar ícone Play após fechar popover
    }, 3000);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setShowPopover(false);
    setShowPlayIcon(false);

    // Limpar timeout
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
    }
  };

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (popoverTimeoutRef.current) {
        clearTimeout(popoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Card Original (Âncora) */}
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer h-full relative group"
        style={{ padding: 0 }}
      >
        <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden relative transition-all duration-300 shadow-lg hover:shadow-2xl">
          {cover_url ? (
            <img
              src={cover_url}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Briefcase className="w-8 h-8 text-amber-500" />
            </div>
          )}

          {rating && rating > 0 && (
            <div className="absolute top-1.5 right-1.5 bg-background/80 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
              <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
              {rating}
            </div>
          )}

          {/* Efeito de Zoom + Ícone Play (Após popover fechar) */}
          {showPlayIcon && isHovering && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all scale-100 hover:scale-110">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Card Info (Sempre visível abaixo do card original) */}
        <div className="mt-2">
          <p className="text-[11px] font-medium truncate text-foreground">{name}</p>
          <p className="text-[9px] text-muted-foreground truncate">{category}</p>
        </div>
      </div>

      {/* Popover Modal Netflix Style - Com animação de surgimento suave (scale in) */}
      {showPopover &&
        createPortal(
          <div
            className="fixed z-[9998] pointer-events-none"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              width: `${popoverPosition.width}px`,
            }}
          >
            <style>{`
              @keyframes scaleInSmooth {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1.5);
                }
              }
            `}</style>
            <div
              className="origin-center"
              style={{
                animation: "scaleInSmooth 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards",
              }}
            >
              <div 
                className="bg-[#181818] rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.95)] border border-white/5 pointer-events-auto cursor-pointer"
                onClick={onClick}
                onMouseEnter={() => {
                  // Se o mouse entrar no popover, resetar o timer
                  if (popoverTimeoutRef.current) {
                    clearTimeout(popoverTimeoutRef.current);
                  }
                  popoverTimeoutRef.current = setTimeout(() => {
                    setShowPopover(false);
                    setShowPlayIcon(true);
                  }, 3000);
                }}
                onMouseLeave={() => {
                  setShowPopover(false);
                  setShowPlayIcon(false);
                  if (popoverTimeoutRef.current) {
                    clearTimeout(popoverTimeoutRef.current);
                  }
                }}
              >
                {/* Video Preview Section */}
                <div className="aspect-video bg-black relative overflow-hidden">
                  {hasTrailer ? (
                    <div className="w-full h-full">
                      {trailer_url?.includes("youtube") || trailer_url?.includes("youtu.be") ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${
                            trailer_url.includes("v=")
                              ? trailer_url.split("v=")[1]
                              : trailer_url.split("/").pop()
                          }?autoplay=1&mute=1&controls=0&loop=1&modestbranding=1&rel=0`}
                          className="w-full h-full pointer-events-none"
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
                    <img src={backdrop_url || cover_url || ""} className="w-full h-full object-cover" alt="" />
                  )}
                  
                  {/* Title overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                     <h3 className="text-[10px] font-bold text-white truncate drop-shadow-md">{name}</h3>
                  </div>
                </div>

                {/* Action Buttons & Info Section */}
                <div className="p-3 space-y-2 bg-[#181818]">
                  {/* Netflix Style Quick Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Play Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPlayTrailer(trailer_url!); }}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      </button>
                      {/* Plus Button */}
                      <button className="w-8 h-8 flex items-center justify-center border-2 border-gray-500 rounded-full hover:border-white transition-colors">
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                      {/* Like Button */}
                      <button className="w-8 h-8 flex items-center justify-center border-2 border-gray-500 rounded-full hover:border-white transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    {/* Expand/Detail Button */}
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-gray-500 rounded-full hover:border-white transition-colors">
                      <ChevronDown className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-green-500 font-bold">98% relevante</span>
                    <span className="border border-gray-500 px-1 rounded text-white">16+</span>
                    <span className="text-white">1h 45min</span>
                    <span className="border border-gray-500 px-0.5 rounded text-[8px] text-white">HD</span>
                  </div>

                  {/* Tags/Category */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] text-white font-medium">• {category}</span>
                  </div>

                  {/* Sinopse Curta */}
                  {sinopse && (
                    <p className="text-[9px] text-gray-300 line-clamp-2 leading-tight">
                      {sinopse}
                    </p>
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
