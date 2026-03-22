import { useCallback, useState } from "react";
import { Search, Tv, Radio, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DBChannel } from "@/hooks/useChannels";

interface DesktopChannelCatalogProps {
  channels: DBChannel[];
  currentChannelId?: string;
  onSelectChannel: (ch: DBChannel) => void;
  open: boolean;
  onClose: () => void;
}

const DesktopChannelCatalog = ({
  channels,
  currentChannelId,
  onSelectChannel,
  open,
  onClose,
}: DesktopChannelCatalogProps) => {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? channels.filter(ch => ch.name.toLowerCase().includes(search.toLowerCase()))
    : channels;

  const handleSelect = useCallback((ch: DBChannel) => {
    onSelectChannel(ch);
  }, [onSelectChannel]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — Netflix style: right side */}
      <div
        className={`absolute bottom-12 right-0 w-[420px] max-w-[35vw] bg-[#181818] z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-out rounded-tl-lg rounded-bl-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ height: "65vh", minHeight: 380, maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Tv className="w-5 h-5" />
            Canais
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar canal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Channel list */}
        <ScrollArea className="flex-1">
          <div className="pb-4">
            {filtered.map(ch => {
              const isCurrent = ch.id === currentChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelect(ch)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-3 transition-colors ${
                    isCurrent ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  {/* Logo */}
                  <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                    {ch.logo ? (
                      <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover" />
                    ) : (
                      <Tv className="w-5 h-5 text-white/30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCurrent ? "text-white" : "text-white/90"}`}>
                      {ch.name}
                    </p>
                    <p className="text-[11px] text-white/40 truncate">{ch.category}</p>
                  </div>

                  {/* Live indicator */}
                  {isCurrent && (
                    <Radio className="w-3.5 h-3.5 text-[#E50914] animate-pulse shrink-0" />
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-white/40 text-sm text-center py-6">Nenhum canal encontrado</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default DesktopChannelCatalog;
