import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const { clubId, userId } = await request.json();

    if (!clubId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Club ID and user ID are required' },
        { status: 400 }
      );
    }

    // Only allow users to leave themselves (security check)
    if (userId !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You can only remove yourself from clubs' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    console.log(`🚪 Leave Club: User ${userId} attempting to leave club ${clubId}`);

    // First, check if user is actually a member
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      console.log(`❌ User ${userId} is not a member of club ${clubId}`);
      return NextResponse.json(
        { success: false, message: 'You are not a member of this club' },
        { status: 400 }
      );
    }

    console.log(`✅ User ${userId} is a ${membership.role} in club ${clubId}`);

    // Don't allow leader to leave without transferring leadership
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (club?.leader_id === userId) {
      console.log(`❌ User ${userId} is the leader and cannot leave club ${clubId}`);
      return NextResponse.json(
        { success: false, message: 'Club leader must transfer leadership before leaving' },
        { status: 400 }
      );
    }

    console.log(`🚪 Proceeding to remove user ${userId} from club ${clubId}`);

    // Remove user from club
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error leaving club:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { success: false, message: 'Failed to leave club' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully removed user ${userId} from club ${clubId}`);

    // Force revalidation of club pages and related data
    try {
      // Revalidate the specific club page
      revalidatePath(`/clubs/${clubId}`);
      // Revalidate the user's clubs page
      revalidatePath('/clubs/my-clubs');
      // Revalidate general clubs page
      revalidatePath('/clubs');
      
      // Invalidate cache tags for this specific club
      revalidateTag(`club-${clubId}`);
      revalidateTag('clubs');
      // Invalidate user-specific club data cache
      revalidateTag(`user-${userId}-clubs`);
      
      console.log(`🔄 Cache invalidated for club ${clubId} and user ${userId} after leave`);
    } catch (revalidateError) {
      console.error('❌ Error during cache revalidation:', revalidateError);
      // Don't fail the request if revalidation fails
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club leave API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
