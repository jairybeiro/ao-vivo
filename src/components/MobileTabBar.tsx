import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Search, User, LogOut, LogIn, GraduationCap, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const MobileTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const tabs = [
    { path: "/", label: "Home", icon: Home },
    { path: "/shorts", label: "Shorts", icon: Film },
    { path: "/cursos", label: "Cursos", icon: BookOpen },
    { path: "/entretenimento", label: "Busca", icon: Search },
    ...(user ? [{ path: "/meus-cursos", label: "Cursos", icon: GraduationCap }] : []),
  ];

  return (
    <>
      {/* Profile overlay */}
      {showProfile && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
          <div
            className="absolute bottom-20 left-4 right-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  setShowProfile(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate("/login");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
              >
                <LogIn className="w-5 h-5" />
                Entrar / Criar conta
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[80] md:hidden bg-background/95 backdrop-blur-2xl border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div>
          <div className="flex items-center justify-around h-14">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                showProfile ? "text-primary" : "text-muted-foreground"
              )}
            >
              <User className="w-5 h-5" strokeWidth={showProfile ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{user ? "Perfil" : "Entrar"}</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileTabBar;
