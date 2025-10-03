import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Invalidate all club-related caches
 * Note: This is a helper function, not a server action
 */
export function invalidateClubCaches(clubId: string, userId?: string) {
  // Invalidate paths
  revalidatePath('/clubs/[id]', 'page');
  revalidatePath(`/clubs/${clubId}`);
  revalidatePath('/clubs/my-clubs');
  revalidatePath('/clubs');
  revalidatePath('/leaderboards');
  revalidatePath('/api/leaderboards');
  
  // Invalidate tags
  revalidateTag(`club-${clubId}`);
  revalidateTag('clubs');
  revalidateTag('leaderboards');
  
  if (userId) {
    revalidateTag(`user-${userId}-clubs`);
    revalidateTag(`user-${userId}`);
  }
}

/**
 * Invalidate member-specific caches
 */
export function invalidateMemberCaches(clubId: string, ...userIds: string[]) {
  invalidateClubCaches(clubId);
  
  revalidateTag(`club-${clubId}-members`);
  
  userIds.forEach(userId => {
    revalidateTag(`user-${userId}`);
  });
}
