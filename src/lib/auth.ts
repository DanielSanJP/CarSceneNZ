"use server"

import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { User } from '@/types/user'

/**
 * Helper function to get user via cached API route
 */
async function getUserViaAPI(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return null;
    }

    // Use our API route with Next.js native fetch for caching
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        // Enable Next.js caching
        next: {
          revalidate: 60, // 1 minute for auth data
          tags: ["auth", "user"],
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("❌ Error fetching user via API:", error);
    return null;
  }
}

/**
 * Get authenticated user with profile data (cached per request)
 * Redirects to login if not authenticated
 */
export const getUser = cache(async (): Promise<User> => {
  const user = await getUserViaAPI();
  
  if (!user) {
    redirect('/login')
  }

  return user;
})

/**
 * Get authenticated user with profile data (cached per request)
 * Returns null if not authenticated (doesn't redirect)
 */
export const getUserOptional = cache(async (): Promise<User | null> => {
  return await getUserViaAPI();
})

/**
 * Check if user is authenticated (auth only, no profile fetch)
 * Use this when you only need to check auth status
 */
export const requireAuth = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  return user
})

/**
 * Sign out the current user and redirect to home page
 */
export async function signOut() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
    if (error) {
    return { error: error.message };
  }

  // Revalidate auth cache and the entire app
  const { revalidateTag } = await import('next/cache');
  revalidateTag("auth");
  revalidateTag("user");
  revalidatePath("/", "layout");
  
  // Redirect to home page
  redirect("/");
}
