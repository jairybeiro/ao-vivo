/**
 * AdSlot - Componente base para exibição de anúncios nativos
 * Renderiza um slot de anúncio com conteúdo customizável via props
 */

interface AdSlotProps {
  /** Rótulo do anúncio (ex: "Patrocinado") */
  label?: string;
  /** Título principal do anúncio */
  title: string;
  /** Texto descritivo curto */
  description: string;
  /** Texto do botão CTA */
  ctaText?: string;
  /** URL de destino do clique */
  ctaUrl?: string;
  /** URL da imagem (opcional) */
  imageUrl?: string;
  /** Variante de layout */
  variant?: "card" | "inline" | "minimal";
  /** Callback ao clicar no CTA */
  onCtaClick?: () => void;
  /** Classes CSS adicionais */
  className?: string;
}

const AdSlot = ({
  label = "Patrocinado",
  title,
  description,
  ctaText = "Saiba mais",
  ctaUrl = "#",
  imageUrl,
  variant = "card",
  onCtaClick,
  className = "",
}: AdSlotProps) => {
  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else if (ctaUrl && ctaUrl !== "#") {
      window.open(ctaUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Variante Card - Para desktop sidebar
  if (variant === "card") {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 shadow-sm ${className}`}>
        {/* Label de patrocinado */}
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </span>

        {/* Imagem opcional */}
        {imageUrl && (
          <div className="mt-3 rounded-md overflow-hidden bg-muted aspect-video">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="mt-3">
          <h4 className="font-semibold text-foreground text-sm leading-tight">
            {title}
          </h4>
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className="mt-4 w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {ctaText}
        </button>
      </div>
    );
  }

  // Variante Inline - Para mobile abaixo do player
  if (variant === "inline") {
    return (
      <div className={`bg-card border border-border rounded-lg p-3 ${className}`}>
        <div className="flex items-start gap-3">
          {/* Imagem pequena opcional */}
          {imageUrl && (
            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
            <h4 className="font-medium text-foreground text-sm leading-tight mt-0.5 line-clamp-1">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {description}
            </p>
          </div>

          {/* CTA compacto */}
          <button
            onClick={handleClick}
            className="flex-shrink-0 py-1.5 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            {ctaText}
          </button>
        </div>
      </div>
    );
  }

  // Variante Minimal - Texto simples
  return (
    <div className={`text-center py-2 ${className}`}>
      <span className="text-xs text-muted-foreground">{label}: </span>
      <button
        onClick={handleClick}
        className="text-xs text-primary hover:underline font-medium"
      >
        {title}
      </button>
    </div>
  );
};

export default AdSlot;
