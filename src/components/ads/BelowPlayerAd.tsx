/**
 * BelowPlayerAd - Anúncio abaixo do player para mobile
 * Exibe um anúncio nativo em formato inline
 * Visível apenas em telas menores que lg
 */

import AdSlot from "./AdSlot";

export interface BelowPlayerAdData {
  id: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

interface BelowPlayerAdProps {
  /** Dados do anúncio a ser exibido */
  ad?: BelowPlayerAdData;
  /** Classes CSS adicionais */
  className?: string;
}

// Dados mock padrão para demonstração
const defaultAd: BelowPlayerAdData = {
  id: "mobile-demo-1",
  title: "Oferta especial para você",
  description: "Produtos com até 50% de desconto. Confira!",
  ctaText: "Conferir",
  ctaUrl: "#",
  imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop",
};

const BelowPlayerAd = ({ ad = defaultAd, className = "" }: BelowPlayerAdProps) => {
  return (
    <div className={`lg:hidden ${className}`}>
      <AdSlot
        variant="inline"
        title={ad.title}
        description={ad.description}
        ctaText={ad.ctaText}
        ctaUrl={ad.ctaUrl}
        imageUrl={ad.imageUrl}
      />
    </div>
  );
};

export default BelowPlayerAd;
