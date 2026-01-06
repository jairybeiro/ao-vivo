import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IframeTest = () => {
  const [url, setUrl] = useState("");
  const [activeUrl, setActiveUrl] = useState("");

  const handleLoad = () => {
    setActiveUrl(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Teste de Iframe/Embed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cole a URL do embed aqui..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleLoad}>Carregar</Button>
          </div>

          {activeUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={activeUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                allow="encrypted-media; autoplay"
                className="w-full h-full"
              />
            </div>
          )}

          {!activeUrl && (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              Cole uma URL e clique em "Carregar" para testar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IframeTest;
