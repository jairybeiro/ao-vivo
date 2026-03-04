import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, Play, Save, AlertCircle } from "lucide-react";
import DirectStreamPlayer from "./DirectStreamPlayer";
import { isHlsUrl } from "@/lib/hlsUtils";

interface DetectStreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  onSaveStream: (url: string) => void;
}

const DetectStreamModal = ({ open, onOpenChange, channelName, onSaveStream }: DetectStreamModalProps) => {
  const [streamUrl, setStreamUrl] = useState("");
  const [testing, setTesting] = useState(false);

  const isValidUrl = streamUrl.trim().length > 0 && isHlsUrl(streamUrl);

  const handleTest = () => {
    console.log("Testing stream:", streamUrl);
    setTesting(true);
  };

  const handleSave = () => {
    console.log("Saving stream:", streamUrl);
    onSaveStream(streamUrl.trim());
    setTesting(false);
    onOpenChange(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setTesting(false);
      setStreamUrl("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            Detectar Stream — {channelName}
          </DialogTitle>
          <DialogDescription>
            Capture a URL do stream HLS (.m3u8, .m3u ou .txt) manualmente a partir do embed player.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Como detectar o stream:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Abra o <strong>DevTools</strong> do navegador (F12)</li>
              <li>Vá na aba <strong>Network</strong></li>
              <li>Filtre por <strong>"m3u8"</strong></li>
              <li>Copie a URL do stream encontrada</li>
              <li>Cole abaixo e teste</li>
            </ol>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="stream-url">URL do stream HLS (.m3u8 / .m3u / .txt)</Label>
            <Input
              id="stream-url"
              placeholder="https://cdn.example.com/.../master.m3u8"
              value={streamUrl}
              onChange={(e) => {
                setStreamUrl(e.target.value);
                setTesting(false);
              }}
              className="font-mono text-sm"
            />
            {streamUrl.trim() && !isValidUrl && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                A URL deve conter .m3u8, .m3u ou .txt
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={!isValidUrl} variant="outline" className="gap-1.5">
              <Play className="w-4 h-4" />
              Testar Stream
            </Button>
            <Button onClick={handleSave} disabled={!isValidUrl || !testing} className="gap-1.5">
              <Save className="w-4 h-4" />
              Salvar Stream
            </Button>
          </div>

          {/* Test Player */}
          {testing && isValidUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <DirectStreamPlayer streamUrl={streamUrl.trim()} channelName={channelName} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetectStreamModal;
