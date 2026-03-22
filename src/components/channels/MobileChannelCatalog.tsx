import { useCallback, useState } from "react";
import { Search, Tv, Radio } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DBChannel } from "@/hooks/useChannels";

interface MobileChannelCatalogProps {
  channels: DBChannel[];
  currentChannelId?: string;
  onSelectChannel: (ch: DBChannel) => void;
  open: boolean;
  onClose: () => void;
}

const MobileChannelCatalog = ({
  channels,
  currentChannelId,
  onSelectChannel,
  open,
  onClose,
}: MobileChannelCatalogProps) => {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? channels.filter(ch => ch.name.toLowerCase().includes(search.toLowerCase()))
    : channels;

  const handleSelect = useCallback((ch: DBChannel) => {
    onSelectChannel(ch);
    onClose();
  }, [onSelectChannel, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — slides up from bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 bg-[#181818] rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "75vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2 shrink-0">
          <h3 className="text-white text-base font-semibold flex items-center gap-2">
            <Tv className="w-4 h-4" />
            Canais
          </h3>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 shrink-0">
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
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-6 space-y-1">
            {filtered.map(ch => {
              const isCurrent = ch.id === currentChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelect(ch)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
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
                    <p className={`text-sm font-medium truncate ${isCurrent ? "text-white" : "text-white/90"}`}>
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
              <p className="text-white/40 text-sm text-center py-4">Nenhum canal encontrado</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default MobileChannelCatalog;
