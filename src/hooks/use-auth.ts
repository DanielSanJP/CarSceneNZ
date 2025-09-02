'use client';

import { useClientAuth } from "@/components/client-auth-provider";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Simple hook that provides current user for client components
// This is safe to use and won't cause infinite loops
export function useCurrentUser() {
  const { user } = useClientAuth();
  
  return user;
}

// For components that need to ensure user is authenticated
export function useRequireAuth() {
  const { user } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  return user;
}
