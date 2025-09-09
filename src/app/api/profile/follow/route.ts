import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Use optimized RPC function
    const supabase = await createClient();
    const { data: result, error } = await supabase.rpc('toggle_user_follow', {
      current_user_id: currentUser.id,
      target_user_id: targetUserId,
      action: action
    });

    if (error || !result?.[0]?.success) {
      return NextResponse.json(
        { error: `Failed to ${action} user` },
        { status: 500 }
      );
    }

    const followResult = result[0];

    return NextResponse.json({
      success: true,
      isFollowing: followResult.is_following,
      newFollowersCount: followResult.new_followers_count,
      action,
      targetUserId
    });

  } catch (error) {
    console.error('Error in follow API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
