import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Sparkles, LogOut, LogIn, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const getInitials = (name?: string | null, email?: string | null) => {
  const cleanName = (name || "").trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  const local = (email || "").split("@")[0];
  if (!local) return "?";
  // Try splitting email local-part on . _ -
  const eparts = local.split(/[._-]+/).filter(Boolean);
  if (eparts.length >= 2) {
    return (eparts[0][0] + eparts[1][0]).toUpperCase();
  }
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

          {isMobile && (
            user ? (
              <div
                className="w-9 h-9 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold shadow-lg ring-1 ring-white/20"
                title={user.email ?? "Usuário"}
              >
                {getInitials(user.email, (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ?? (user.user_metadata as { full_name?: string; name?: string } | null)?.name)}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-lg ring-1 ring-white/20 active:scale-95 transition-transform"
                title="Entrar"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
