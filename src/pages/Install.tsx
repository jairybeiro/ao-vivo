import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, Share, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erro ao instalar:", error);
    }
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O StreamPlayer já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Abrir App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Instalar StreamPlayer</CardTitle>
          <CardDescription>
            Instale o app na tela inicial do seu dispositivo para acesso rápido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Android / Chrome */}
          {deferredPrompt && (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Instalar Agora
            </Button>
          )}

          {/* iOS Instructions */}
          {isIOS && !deferredPrompt && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no iOS, siga os passos:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Toque em</span>
                    <Share className="h-4 w-4" />
                    <span className="text-sm font-medium">Compartilhar</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Selecione</span>
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Adicionar à Tela de Início</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="text-sm">Confirme tocando em <span className="font-medium">Adicionar</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other browsers */}
          {!isIOS && !deferredPrompt && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Use o menu do navegador para adicionar à tela inicial.
              </p>
              <p className="text-xs text-muted-foreground">
                Procure por "Adicionar à tela inicial" ou "Instalar app".
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Continuar no navegador
            </Button>
          </div>

          {/* Benefits */}
          <div className="pt-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium">
              Vantagens do app:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Acesso rápido pela tela inicial
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Experiência em tela cheia
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Carregamento mais rápido
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;