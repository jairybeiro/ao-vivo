import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Film, Clapperboard, BookOpen, Sparkles, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface GenreDropdownProps {
  label: string;
  path: string;
  icon: React.ReactNode;
  isActive: boolean;
  categories: string[];
  onNavigate: (path: string) => void;
}

const GenreDropdown = ({ label, path, icon, isActive, categories, onNavigate }: GenreDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onNavigate(path)}
        onMouseEnter={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        {categories.length > 0 && <ChevronDown className="w-3 h-3 hidden sm:block" />}
      </button>

      {open && categories.length > 0 && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute top-full left-0 mt-1 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl z-[60] min-w-[280px] max-w-[600px] p-3 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5">
            <button
              onClick={() => { onNavigate(path); setOpen(false); }}
              className="text-left px-2 py-1.5 text-xs font-semibold text-primary hover:bg-accent rounded transition-colors"
            >
              Todos os Gêneros
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { onNavigate(`${path}?genre=${encodeURIComponent(cat)}`); setOpen(false); }}
                className="text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors truncate"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MainHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [movieCategories, setMovieCategories] = useState<string[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const [{ data: mc }, { data: sc }] = await Promise.all([
        supabase.from("vod_movies").select("category").eq("is_active", true),
        supabase.from("vod_series").select("category").eq("is_active", true),
      ]);
      if (mc) {
        const unique = [...new Set(mc.map((r: any) => r.category).filter(Boolean))].sort();
        setMovieCategories(unique);
      }
      if (sc) {
        const unique = [...new Set(sc.map((r: any) => r.category).filter(Boolean))].sort();
        setSeriesCategories(unique);
      }
    };
    fetchCategories();
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            AO VIVO
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {/* Home */}
            <button
              onClick={() => navigate("/")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive("/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* Filmes with genre dropdown */}
            <GenreDropdown
              label="Filmes"
              path="/filmes"
              icon={<Film className="w-4 h-4" />}
              isActive={isActive("/filmes")}
              categories={movieCategories}
              onNavigate={(p) => navigate(p)}
            />

            {/* Séries with genre dropdown */}
            <GenreDropdown
              label="Séries"
              path="/series"
              icon={<Clapperboard className="w-4 h-4" />}
              isActive={isActive("/series")}
              categories={seriesCategories}
              onNavigate={(p) => navigate(p)}
            />

            {/* Cursos */}
            <button
              onClick={() => navigate("/cursos")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive("/cursos")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Cursos</span>
            </button>

            {/* Inspire-se */}
            <button
              onClick={() => navigate("/entretenimento")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive("/entretenimento")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Inspire-se</span>
            </button>
          </nav>

          {/* Logout */}
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
