import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the user's last seen inbox timestamp
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_seen_inbox')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    const lastSeenInbox = userData?.last_seen_inbox || new Date(0).toISOString();

    // Count messages received after last seen timestamp
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .gt('created_at', lastSeenInbox);

    if (countError) {
      console.error('Error counting unread messages:', countError);
      return NextResponse.json({ error: 'Failed to count unread messages' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Unexpected error in unread-count API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
