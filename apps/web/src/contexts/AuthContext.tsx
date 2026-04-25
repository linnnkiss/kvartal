import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@kvartal/shared';
import { getMe } from '../lib/api/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kvartal_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('kvartal_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  function login(userData: User, tok: string) {
    localStorage.setItem('kvartal_token', tok);
    setToken(tok);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('kvartal_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
