import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MainHeaderProps {
  transparent?: boolean;
}

const MainHeader = ({ transparent = false }: MainHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { path: "/cursos", label: "Cursos", icon: <BookOpen className="w-4 h-4" /> },
    { path: "/entretenimento", label: "Inspire-se", icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        transparent
          ? "bg-transparent border-b-0"
          : "border-b border-border bg-card/80 backdrop-blur-md"
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
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>

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
