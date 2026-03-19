import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";

export const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium flex-1">Nova atualização disponível!</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-primary-foreground text-primary text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90 transition-opacity shrink-0"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};
