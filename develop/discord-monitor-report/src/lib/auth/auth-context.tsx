"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "staff" | "manager";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          // Validate JSON structure before parsing to prevent XSS
          const parsedUser = JSON.parse(storedUser);

          // Validate user object structure
          if (
            parsedUser &&
            typeof parsedUser === "object" &&
            typeof parsedUser.id === "number" &&
            typeof parsedUser.name === "string" &&
            typeof parsedUser.email === "string" &&
            (parsedUser.role === "staff" || parsedUser.role === "manager")
          ) {
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            // Invalid user data, clear localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (parseError) {
          // Invalid JSON, clear localStorage
          console.error("Failed to parse stored user data:", parseError);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      // localStorage access error
      console.error("Failed to access localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "ログインに失敗しました");
    }

    const data = await response.json();

    // Store token and user (only in browser)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }

    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    // Clear localStorage (only in browser)
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (error) {
        console.error("Failed to clear localStorage:", error);
      }
    }

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
