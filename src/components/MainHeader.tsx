import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Sparkles, LogOut, LogIn, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
        "sticky top-0 z-50 transition-colors duration-300",
        transparent
          ? "bg-transparent border-b-0"
          : "border-b border-border bg-card/80 backdrop-blur-md",
        isMobile && "bg-black/60 backdrop-blur-2xl border-b-0"
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            AO VIVO
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
