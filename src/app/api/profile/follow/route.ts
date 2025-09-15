import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { targetUserId, action } = await request.json();

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'Target user ID and action are required' },
        { status: 400 }
      );
    }

    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot follow/unfollow yourself' },
        { status: 400 }
      );
    }

    if (action !== 'follow' && action !== 'unfollow') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "follow" or "unfollow"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    console.log(`🔄 SIMPLE: ${action} user ${targetUserId}`);

    let isFollowing;

    if (action === 'follow') {
      // Add follow relationship
      const { error: insertError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUser.id,
          following_id: targetUserId
        });

      if (insertError) {
        // Check if already following (unique constraint error)
        if (insertError.code === '23505') {
          return NextResponse.json({
            success: true,
            isFollowing: true,
            message: 'Already following this user'
          });
        }
        throw insertError;
      }

      isFollowing = true;
      console.log("✅ Follow added");

    } else {
      // Remove follow relationship
      const { error: deleteError } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetUserId);

      if (deleteError) {
        throw deleteError;
      }

      isFollowing = false;
      console.log("✅ Follow removed");
    }

    // Get updated followers count for the target user
    const { count: newFollowersCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    console.log(`✅ SIMPLE: Follow toggled - isFollowing: ${isFollowing}, followers: ${newFollowersCount}`);

    // Revalidate relevant caches
    revalidateTag("profile");
    revalidateTag(`profile-${targetUserId}`);
    revalidateTag(`user-${currentUser.id}-following`);

    return NextResponse.json({
      success: true,
      isFollowing,
      newFollowersCount: newFollowersCount || 0,
      action,
      targetUserId
    });

  } catch (error) {
    console.error('❌ Error in follow API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
