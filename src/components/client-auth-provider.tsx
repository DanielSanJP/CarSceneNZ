"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import type { User } from "@/types/user";

interface ClientAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(
  undefined
);

export function ClientAuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserProfile = async (authUserId: string): Promise<User | null> => {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUserId)
        .single();

      if (error || !profile) {
        return null;
      }

      return {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name || profile.username,
        email: "", // We'll get this from auth
        profile_image_url: profile.profile_image_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        return;
      }

      const profile = await fetchUserProfile(authUser.id);
      if (profile) {
        setUser({ ...profile, email: authUser.email || "" });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        // Only update user if we don't already have one
        if (!user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser({ ...profile, email: session.user.email || "" });
          }
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]); // Include user in deps to prevent updates when already have user

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}
