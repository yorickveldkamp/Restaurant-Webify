import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AuthUser, apiGetMe, apiLogin, apiLogout } from "../lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  authLoaded: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    apiGetMe()
      .then(u => { setUser(u); })
      .catch(() => { setUser(null); })
      .finally(() => setAuthLoaded(true));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await apiLogin(username, password);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoaded, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
