import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ADMIN_SESSION_KEY, isSupabaseConfigured, supabase } from '@/src/lib/supabase';

const EXPECTED_ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || 'Mamaputnigeria';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  isConfigured: boolean;
  signInWithPasswordOnly: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (saved && saved === EXPECTED_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const signInWithPasswordOnly = useCallback(async (password: string) => {
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('verify_admin_password', {
        p_password: password,
      });
      if (!error) {
        if (!data) {
          throw new Error('Incorrect admin password. Please try again.');
        }
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, password);
        setIsAuthenticated(true);
        return;
      }
    }

    if (password !== EXPECTED_ADMIN_PASSWORD) {
      throw new Error('Incorrect admin password. Please try again.');
    }
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, password);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithPasswordOnly,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
