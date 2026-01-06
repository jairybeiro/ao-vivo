import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tv } from "lucide-react";

interface EmbedChannel {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  embed_url: string;
}

const TestEmbed = () => {
  const [channels, setChannels] = useState<EmbedChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<EmbedChannel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [loading, setLoading] = useState(true);

  const categories = ["Todos", "Notícias", "Esportes", "Filmes", "Variedades"];

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("channels")
      .select("id, name, category, logo, embed_url")
      .not("embed_url", "is", null)
      .neq("embed_url", "");

    if (!error && data) {
      const embedChannels = data.filter(ch => ch.embed_url) as EmbedChannel[];
      setChannels(embedChannels);
      if (embedChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(embedChannels[0]);
      }
    }
    setLoading(false);
  };

  const filteredChannels = selectedCategory === "Todos" 
    ? channels 
    : channels.filter(ch => ch.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com categorias */}
      <div className="border-b border-border bg-card p-2 md:p-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full grid grid-cols-5 bg-muted/50 h-10 md:h-12 p-0.5 md:p-1 gap-0.5 md:gap-1">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="px-1 md:px-4 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground truncate"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Player área */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {selectedChannel ? (
            <iframe
              src={selectedChannel.embed_url}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              allow="encrypted-media"
              className="w-full h-[50vh] md:h-full"
            />
          ) : (
            <div className="text-muted-foreground text-center p-8">
              {loading ? "Carregando canais..." : "Nenhum canal com embed disponível"}
            </div>
          )}
        </div>

        {/* Lista de canais lateral */}
        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-border bg-card">
          <div className="p-3 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">
              Canais ({filteredChannels.length})
            </h2>
          </div>
          <ScrollArea className="h-[30vh] md:h-[calc(100vh-8rem)]">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="text-sm text-muted-foreground p-2">Carregando...</div>
              ) : filteredChannels.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2">
                  Nenhum canal nesta categoria
                </div>
              ) : (
                filteredChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      selectedChannel?.id === channel.id
                        ? "bg-primary/20 border border-primary/50"
                        : "hover:bg-muted"
                    }`}
                  >
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-8 h-8 rounded object-contain bg-black"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <Tv className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {channel.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default TestEmbed;
