interface LiveIndicatorProps {
  isLive?: boolean;
}

const LiveIndicator = ({ isLive = true }: LiveIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
      <div className={`relative flex items-center justify-center ${isLive ? "animate-live-pulse" : ""}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-live" : "bg-muted-foreground"}`} />
        {isLive && (
          <div className="absolute w-2.5 h-2.5 rounded-full bg-live animate-ping" />
        )}
      </div>
      <span className={`text-xs font-bold uppercase tracking-wider ${isLive ? "text-live" : "text-muted-foreground"}`}>
        {isLive ? "AO VIVO" : "OFFLINE"}
      </span>
    </div>
  );
};

export default LiveIndicator;
