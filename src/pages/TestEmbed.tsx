import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TestEmbed = () => {
  const [embedUrl, setEmbedUrl] = useState("https://alerquina54541.embedtv.best/cnnbrasil");
  const [activeUrl, setActiveUrl] = useState("https://alerquina54541.embedtv.best/cnnbrasil");

  const handleLoad = () => {
    setActiveUrl(embedUrl);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Teste de Embed</h1>
        
        <div className="flex gap-2">
          <Input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="Cole a URL do embed aqui..."
            className="flex-1"
          />
          <Button onClick={handleLoad}>Carregar</Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-black">
          <iframe
            src={activeUrl}
            width="100%"
            height="480"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            allow="encrypted-media"
            className="block"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          URL ativa: <code className="bg-muted px-2 py-1 rounded">{activeUrl}</code>
        </p>
      </div>
    </div>
  );
};

export default TestEmbed;
