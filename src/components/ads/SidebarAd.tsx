/**
 * SidebarAd - Anúncio lateral para desktop
 * Exibe um card de anúncio nativo à direita do player
 * Visível apenas em telas grandes (lg+)
 */

import AdSlot from "./AdSlot";

export interface SidebarAdData {
  id: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

interface SidebarAdProps {
  /** Dados do anúncio a ser exibido */
  ad?: SidebarAdData;
  /** Classes CSS adicionais */
  className?: string;
}

// Dados mock padrão para demonstração
const defaultAd: SidebarAdData = {
  id: "demo-1",
  title: "Descubra ofertas exclusivas",
  description: "Aproveite as melhores promoções em produtos selecionados. Tempo limitado!",
  ctaText: "Ver ofertas",
  ctaUrl: "#",
  imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=225&fit=crop",
};

const SidebarAd = ({ ad = defaultAd, className = "" }: SidebarAdProps) => {
  return (
    <div className={`hidden lg:block w-64 flex-shrink-0 ${className}`}>
      <AdSlot
        variant="card"
        title={ad.title}
        description={ad.description}
        ctaText={ad.ctaText}
        ctaUrl={ad.ctaUrl}
        imageUrl={ad.imageUrl}
      />
    </div>
  );
};

export default SidebarAd;
