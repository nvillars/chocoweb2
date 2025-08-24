"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'user' | 'admin';

type AuthState = {
  // undefined = not initialized yet, null = no user, object = logged in
  user: { id: number; name: string; email: string; role: Role } | null | undefined;
  login: (email: string, role?: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // start as undefined so consumers can distinguish "not initialized yet"
  const [user, setUser] = useState<AuthState['user']>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ladulceria:auth');
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } catch {
      // ignore parse errors in demo
      setUser(null);
    }
  }, []);

  const login = (email: string, role: Role = 'user') => {
    const demo = { id: role === 'admin' ? 1 : 2, name: role === 'admin' ? 'Admin Demo' : 'Usuario Demo', email, role };
    setUser(demo);
    localStorage.setItem('ladulceria:auth', JSON.stringify(demo));
    // write a simple session cookie so server middleware can check role (demo only)
    try {
      const value = encodeURIComponent(JSON.stringify(demo));
      document.cookie = `ladulceria_auth=${value}; Path=/; Max-Age=${60 * 60 * 24}`;
    } catch {
      // ignore cookie failures in some environments
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ladulceria:auth');
    // remove cookie
    document.cookie = 'ladulceria_auth=; Path=/; Max-Age=0';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
