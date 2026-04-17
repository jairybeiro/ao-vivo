import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Sparkles, LogOut, LogIn, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemo } from "react";

const getInitials = (email?: string | null, name?: string | null) => {
  const source = (name || email || "").trim();
  if (!source) return "?";
  // If name has spaces, take first letter of first 2 words
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // Fallback: first 2 letters of email local-part
  const local = source.split("@")[0];
  return local.slice(0, 2).toUpperCase();
};

interface MainHeaderProps {
  transparent?: boolean;
}

const MainHeader = ({ transparent = false }: MainHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { path: "/cursos", label: "Cursos", icon: <BookOpen className="w-4 h-4" /> },
    { path: "/entretenimento", label: "Inspire-se", icon: <Sparkles className="w-4 h-4" /> },
    ...(user ? [{ path: "/meus-cursos", label: "Meus Cursos", icon: <GraduationCap className="w-4 h-4" /> }] : []),
  ];

  return (
    <header
      className={cn(
        "top-0 left-0 right-0 z-50 transition-colors duration-300",
        isMobile
          ? "absolute bg-transparent border-b-0"
          : "sticky",
        !isMobile && (transparent
          ? "bg-transparent border-b-0"
          : "border-b border-border bg-card/80 backdrop-blur-md")
      )}
      style={{ paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className={cn(
              "font-bold tracking-tight hover:text-primary transition-colors",
              isMobile ? "text-2xl text-white drop-shadow-lg" : "text-lg text-foreground"
            )}
            style={isMobile ? { fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: "-0.02em" } : undefined}
          >
            C&B
          </button>

          {/* Desktop nav */}
          {!isMobile && (
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          )}

          {/* Desktop auth button */}
          {!isMobile && (
            user ? (
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )
          )}

          {isMobile && <div className="w-8" />}
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
