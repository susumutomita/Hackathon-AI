"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";

interface AuthContextType {
  isVerified: boolean;
  setIsVerified: (isVerified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <AuthContext.Provider value={{ isVerified, setIsVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
