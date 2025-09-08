import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update the user's last_seen_inbox timestamp
    const { error } = await supabase
      .from('users')
      .update({ last_seen_inbox: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last_seen_inbox:', error);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    // Send broadcast to clear badge count immediately
    try {
      await supabase.channel(`inbox-badges-${userId}`).send({
        type: 'broadcast',
        event: 'messages_marked_read',
        payload: {
          user_id: userId,
          timestamp: new Date().toISOString()
        }
      });
      console.log(`✅ Badge clear broadcast sent for user ${userId}`);
    } catch (broadcastError) {
      console.error('Error sending badge clear broadcast:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in mark-read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
