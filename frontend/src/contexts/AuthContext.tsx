import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { apiFetch, apiFetchAuth, clearTokens, getAccessToken, setTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (staffId: string, password: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  canSubmitEOD: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const me = await apiFetchAuth<{
          id: number;
          username: string;
          first_name: string;
          last_name: string;
          staff_profile?: { staff_id: string; role: 'admin' | 'supervisor' | 'staff' } | null;
        }>("/api/users/me/");

        if (cancelled) return;

        const name = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() || me.username;
        const staffId = me.staff_profile?.staff_id ?? me.username;
        const role = me.staff_profile?.role ?? 'staff';

        setUser({
          id: String(me.id),
          name,
          staffId,
          role,
          createdAt: new Date().toISOString(),
        });
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (staffId: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const tokens = await apiFetch<{ access: string; refresh: string }>("/api/token/", {
        method: "POST",
        body: { username: staffId, password },
      });

      setTokens(tokens);

      const me = await apiFetchAuth<{
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        staff_profile?: { staff_id: string; role: 'admin' | 'supervisor' | 'staff' } | null;
      }>("/api/users/me/");

      const name = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() || me.username;
      const resolvedStaffId = me.staff_profile?.staff_id ?? me.username;
      const role = me.staff_profile?.role ?? 'staff';

      const resolvedUser: User = {
        id: String(me.id),
        name,
        staffId: resolvedStaffId,
        role,
        createdAt: new Date().toISOString(),
      };

      setUser(resolvedUser);

      return resolvedUser;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearTokens();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSupervisor: user?.role === 'supervisor',
        canSubmitEOD: user?.role === 'admin' || user?.role === 'supervisor',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
