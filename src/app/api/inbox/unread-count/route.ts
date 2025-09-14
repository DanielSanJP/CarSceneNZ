import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔢 Fetching unread count for user: ${userId}`);

    const supabase = await createClient();
    
    // Debug: Check if we have an authenticated user in this context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log(`🔍 UNREAD AUTH - User: ${authUser?.id}, Error:`, authError);
    console.log(`🔍 UNREAD - Requested userId: ${userId}`);
    console.log(`🔍 UNREAD - Auth user matches requested: ${authUser?.id === userId}`);

    // Get user's last_seen_inbox timestamp
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_seen_inbox')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }

    const lastSeenInbox = userData?.last_seen_inbox || new Date(0).toISOString();
    console.log(`🔍 User last seen inbox: ${lastSeenInbox}`);

    // Count unread messages (messages created after last_seen_inbox)
    const { count, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .gt('created_at', lastSeenInbox);

    if (countError) {
      console.error('❌ Error counting unread messages:', countError);
      return NextResponse.json({ error: 'Failed to count unread messages' }, { status: 500 });
    }

    const unreadCount = count || 0;
    console.log(`✅ Unread count for user ${userId}: ${unreadCount}`);

    return NextResponse.json({
      count: unreadCount,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `unread_count_${userId}`,
        last_seen_inbox: lastSeenInbox,
      },
    }, {
      headers: {
        // Prevent caching to ensure real-time data
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('❌ Error in unread count API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' }, 
      { status: 500 }
    );
  }
}
