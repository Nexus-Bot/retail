"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { authAPI, usersAPI } from "@/lib/api";
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  CreateUserResponse
} from "@/types/api";
import { ErrorHandler } from "@/types/errors";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (
    credentials: LoginRequest
  ) => Promise<{ success: boolean; message: string; data?: LoginResponse }>;
  register: (
    userData: CreateUserRequest
  ) => Promise<{ success: boolean; message: string; data?: CreateUserResponse }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (
    credentials: LoginRequest
  ): Promise<{ success: boolean; message: string; data?: LoginResponse }> => {
    try {
      const response = await authAPI.login(credentials);
      const data = response.data;

      if (data?.token) {
        Cookies.set("auth_token", data.token, { expires: 7 }); // 7 days
        // Convert login response user to AuthUser format
        const authUser: AuthUser = {
          _id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          agency: data.user.agency as AuthUser['agency'],
          permissions: data.user.permissions,
          status: 'active', // Default status from login
          lastLogin: data.user.lastLogin,
          createdAt: new Date().toISOString(), // Fallback
          updatedAt: new Date().toISOString(), // Fallback
        };
        setUser(authUser);
      }

      return {
        success: true,
        data,
        message: data.message || "Login successful"
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: ErrorHandler.getErrorMessage(error),
      };
    }
  };

  const register = async (
    userData: CreateUserRequest
  ): Promise<{ success: boolean; message: string; data?: CreateUserResponse }> => {
    try {
      const response = await usersAPI.createUser(userData);
      const data = response.data;

      return {
        success: data.success,
        data,
        message: data.message || "Registration successful"
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: ErrorHandler.getErrorMessage(error),
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch {
      // Even if logout fails on server, clear client state
    } finally {
      Cookies.remove("auth_token");
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await authAPI.getProfile();
      setUser(response.data); // getProfile returns AuthUser directly
    } catch {
      // Token is invalid, remove it
      Cookies.remove("auth_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
