import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  adminCheckLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isNetworkError = (message?: string) => {
  return /failed to fetch|networkerror/i.test(message ?? "");
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);

  const checkAdminRole = async (userId: string) => {
    setAdminCheckLoading(true);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!error) {
        setIsAdmin(!!data);
        setAdminCheckLoading(false);
        return;
      }

      lastError = error as Error;
      if (!isNetworkError(lastError.message) || attempt === 2) {
        break;
      }

      await wait(250 * (attempt + 1));
    }

    console.error("Erro ao validar role admin:", lastError);
    setIsAdmin(false);
    setAdminCheckLoading(false);
  };

  const recoverSessionFromStorage = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return false;
    }

    setSession(session);
    setUser(session.user);
    await checkAdminRole(session.user.id);
    return true;
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setAdminCheckLoading(false);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setAdminCheckLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] signIn called for:", email);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[Auth] signIn attempt ${attempt + 1}`);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        console.log("[Auth] signIn response:", { 
          hasSession: !!data?.session, 
          hasUser: !!data?.user,
          errorMessage: error?.message,
          errorStatus: (error as any)?.status
        });

        if (!error && data?.session) {
          console.log("[Auth] signIn SUCCESS");
          return { error: null };
        }

        if (error) {
          lastError = error as Error;
        } else {
          // No error but no session either
          lastError = new Error("Login retornou sem sessão");
        }
      } catch (error) {
        console.error("[Auth] signIn EXCEPTION:", error);
        lastError = error instanceof Error ? error : new Error("Erro de autenticação");
      }

      if (isNetworkError(lastError?.message)) {
        console.log("[Auth] Network error detected, trying session recovery...");
        const recovered = await recoverSessionFromStorage();
        if (recovered) {
          console.log("[Auth] Session recovered from storage!");
          return { error: null };
        }
      }

      if (!isNetworkError(lastError?.message) || attempt === 2) {
        break;
      }

      await wait(300 * (attempt + 1));
    }

    console.log("[Auth] All attempts failed, final error:", lastError?.message);
    return { error: lastError };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setAdminCheckLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, loading, adminCheckLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
