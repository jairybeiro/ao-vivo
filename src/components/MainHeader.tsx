import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Tv, Radio, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Cursos", path: "/cursos", icon: BookOpen },
  { label: "Entretenimento", path: "/entretenimento", icon: Tv },
  { label: "Canais", path: "/channels", icon: Radio },
];

const MainHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

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
          {/* Logo / Brand */}
          <button
            onClick={() => navigate("/")}
            className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            AO VIVO
          </button>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive(path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* Actions */}
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
