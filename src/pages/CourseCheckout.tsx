import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCourseDetails } from "@/hooks/useCourses";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const CourseCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { course, loading } = useCourseDetails(courseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!course || !(course as any).priceCents) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Curso não disponível para compra.</p>
      </div>
    );
  }

  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        courseId: course.id,
        courseTitle: course.title,
        priceCents: (course as any).priceCents,
        customerEmail: user?.email,
        userId: user?.id || "",
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Falha ao criar sessão de pagamento");
    }
    return data.clientSecret;
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Valor: R$ {((course as any).priceCents / 100).toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/5">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
