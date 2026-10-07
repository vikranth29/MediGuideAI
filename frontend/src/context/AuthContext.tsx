import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, AuthSession, AuthUser } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSession()
      .then((session: AuthSession) => setUser(session.user))
      .catch((error) => console.error('Failed to restore authentication session', error))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password, remember) {
      const session = await api.login(email, password, remember);
      setUser(session.user);
    },
    async register(fullName, email, password, confirmPassword) {
      await api.register(fullName, email, password, confirmPassword);
    },
    async logout() {
      const session = await api.logout();
      setUser(session.user);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
