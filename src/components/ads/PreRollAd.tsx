/**
 * PreRollAd - Overlay de anúncio antes do vídeo
 * Exibe um anúncio por 5 segundos com contador regressivo
 * Mostra botão "Pular" após o contador
 * Executado no máximo uma vez por sessão
 */

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface PreRollAdData {
  id: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  duration?: number; // segundos
}

interface PreRollAdProps {
  /** Dados do anúncio */
  ad?: PreRollAdData;
  /** Callback quando o anúncio termina ou é pulado */
  onComplete: () => void;
  /** Chave de sessão para controle de exibição única */
  sessionKey?: string;
}

// Dados mock padrão
const defaultAd: PreRollAdData = {
  id: "preroll-1",
  title: "Patrocinador do conteúdo",
  description: "Conheça nossos produtos e serviços exclusivos com condições especiais.",
  ctaText: "Saiba mais",
  ctaUrl: "#",
  imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
  duration: 5,
};

const SESSION_STORAGE_KEY = "preroll_shown";

const PreRollAd = ({ 
  ad = defaultAd, 
  onComplete,
  sessionKey = "default"
}: PreRollAdProps) => {
  const storageKey = `${SESSION_STORAGE_KEY}_${sessionKey}`;
  const duration = ad.duration || 5;
  
  const [countdown, setCountdown] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const [visible, setVisible] = useState(false);

  // Verifica se o anúncio já foi exibido nesta sessão
  useEffect(() => {
    const shown = sessionStorage.getItem(storageKey);
    if (!shown) {
      setVisible(true);
      sessionStorage.setItem(storageKey, "true");
    } else {
      // Já foi exibido, chama onComplete imediatamente
      onComplete();
    }
  }, [storageKey, onComplete]);

  // Contador regressivo
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleSkip = useCallback(() => {
    setVisible(false);
    onComplete();
  }, [onComplete]);

  const handleCtaClick = () => {
    if (ad.ctaUrl && ad.ctaUrl !== "#") {
      window.open(ad.ctaUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center">
      {/* Imagem de fundo ou gradiente */}
      {ad.imageUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${ad.imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
      )}

      {/* Conteúdo do anúncio */}
      <div className="relative z-10 max-w-md mx-auto px-6 text-center">
        <span className="inline-block text-xs text-muted-foreground uppercase tracking-wide mb-4 bg-background/50 px-3 py-1 rounded-full">
          Patrocinado
        </span>
        
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
          {ad.title}
        </h3>
        
        <p className="text-sm md:text-base text-white/80 mb-6">
          {ad.description}
        </p>

        {ad.ctaText && (
          <button
            onClick={handleCtaClick}
            className="py-2 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {ad.ctaText}
          </button>
        )}
      </div>

      {/* Botão de pular / Contador */}
      <div className="absolute top-4 right-4 z-10">
        {canSkip ? (
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 py-2 px-4 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur-sm"
          >
            <span>Pular anúncio</span>
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="py-2 px-4 bg-black/50 text-white text-sm rounded-lg backdrop-blur-sm">
            Pular em <span className="font-bold">{countdown}</span>s
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${((duration - countdown) / duration) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default PreRollAd;
