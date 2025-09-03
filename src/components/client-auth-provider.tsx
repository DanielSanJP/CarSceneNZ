"use client";

import React, { createContext, useContext } from "react";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ClientAuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function ClientAuthProvider({
  children,
  initialUser,
}: ClientAuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user: initialUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser(): User | null {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a ClientAuthProvider");
  }
  return context.user;
}
