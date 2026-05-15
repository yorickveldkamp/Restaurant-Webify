import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const STORAGE_KEY = "haccp:user-name";

interface NameContextValue {
  name: string;
  setName: (n: string) => void;
  clearName: () => void;
  loaded: boolean;
}

const NameContext = createContext<NameContextValue | null>(null);

export function NameProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? "";
      setNameState(stored);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const setName = useCallback((n: string) => {
    const trimmed = n.trim();
    setNameState(trimmed);
    try { localStorage.setItem(STORAGE_KEY, trimmed); } catch { /* ignore */ }
  }, []);

  const clearName = useCallback(() => {
    setNameState("");
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <NameContext.Provider value={{ name, setName, clearName, loaded }}>
      {children}
    </NameContext.Provider>
  );
}

export function useName() {
  const ctx = useContext(NameContext);
  if (!ctx) throw new Error("useName must be used inside NameProvider");
  return ctx;
}
