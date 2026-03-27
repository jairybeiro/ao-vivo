import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkCheckout: string;
  urlImagemAnuncio?: string | null;
  title: string;
}

export const CheckoutModal = ({ isOpen, onClose, linkCheckout, urlImagemAnuncio, title }: CheckoutModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden bg-card border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {urlImagemAnuncio && (
              <div className="w-full aspect-video overflow-hidden">
                <img src={urlImagemAnuncio} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 space-y-4 text-center">
              <h3 className="text-xl font-bold text-foreground">
                Gostou de "{title}"?
              </h3>
              <p className="text-sm text-muted-foreground">
                Acesse o conteúdo completo e transforme sua mentalidade de negócios.
              </p>
              <Button
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-base"
                onClick={() => window.open(linkCheckout, "_blank")}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Quero Acessar Agora
              </Button>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Continuar assistindo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
