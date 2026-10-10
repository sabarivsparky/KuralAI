import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    let cancelled = false;
    authAPI
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (emailOrPayload, password, departmentCode, requiredRole) => {
    let payload;
    if (typeof emailOrPayload === "object" && emailOrPayload !== null) {
      payload = emailOrPayload;
    } else {
      payload = { email: emailOrPayload, password, departmentCode, requiredRole };
    }
    const data = await authAPI.login(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async ({ displayName, email, password, preferredLanguage }) => {
    const data = await authAPI.signup({ displayName, email, password, preferredLanguage });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const data = await authAPI.updateProfile(fields);
    setUser(data.user);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.me();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
