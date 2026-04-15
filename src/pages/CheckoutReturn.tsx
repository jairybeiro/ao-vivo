import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-white/5 bg-card/60 backdrop-blur-sm"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu acesso ao curso foi liberado. Você já pode começar a estudar.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => navigate("/meus-cursos")} className="gap-2 rounded-xl">
              <BookOpen className="w-4 h-4" />
              Ir para Meus Cursos
            </Button>
            <Button variant="outline" onClick={() => navigate("/cursos")} className="rounded-xl">
              Explorar mais cursos
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CheckoutReturn;
