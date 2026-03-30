import { useState, useRef, useEffect } from "react";
import { Star, PlayCircle } from "lucide-react";
import HlsAutoplayVideo from "@/components/HlsAutoplayVideo";
import { Briefcase } from "lucide-react";

interface CineBusinessCardProps {
  id: string;
  name: string;
  category: string;
  cover_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_url: string | null;
  onClick: () => void;
}

const CineBusinessCard = ({
  id,
  name,
  category,
  cover_url,
  backdrop_url,
  rating,
  trailer_url,
  onClick,
}: CineBusinessCardProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determinar se há trailer disponível
  const hasTrailer = trailer_url && (trailer_url.includes("youtube") || trailer_url.includes("youtu.be") || trailer_url.endsWith(".mp4") || trailer_url.includes(".m3u8"));

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="cursor-pointer group h-full"
    >
      <div className={`aspect-[2/3] bg-muted rounded-lg overflow-hidden relative transition-all duration-300 ${
        isHovering ? "scale-105 shadow-2xl" : "scale-100 shadow-lg"
      }`}>
        {/* Background Image ou Trailer */}
        {isHovering && hasTrailer ? (
          <div className="absolute inset-0 w-full h-full">
            {trailer_url?.includes("youtube") || trailer_url?.includes("youtu.be") ? (
              // YouTube Embed
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
              // MP4 ou M3U8
              <HlsAutoplayVideo
                src={trailer_url}
                poster={backdrop_url}
                delayMs={0}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : (
          // Cover Image
          <>
            {cover_url ? (
              <img
                src={cover_url}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                <Briefcase className="w-8 h-8 text-amber-500" />
              </div>
            )}
          </>
        )}

        {/* Overlay Gradient */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isHovering ? "opacity-100" : "opacity-0"
        }`} />

        {/* Play Button - Aparece no Hover */}
        {isHovering && hasTrailer && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <PlayCircle className="w-12 h-12 text-white opacity-90 hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Rating Badge */}
        {rating && rating > 0 && (
          <div className="absolute top-1.5 right-1.5 bg-background/80 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 z-20">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {rating}
          </div>
        )}

        {/* Action Buttons - Aparecem no Hover */}
        {isHovering && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded hover:bg-primary/90 transition-colors"
            >
              Ver Detalhes
            </button>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="mt-2">
        <p className="text-xs font-medium truncate text-foreground">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{category}</p>
      </div>
    </div>
  );
};

export default CineBusinessCard;
