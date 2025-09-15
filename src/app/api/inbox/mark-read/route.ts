import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    // Use authenticated user instead of accepting userId parameter
    const currentUser = await requireAuth();
    const userId = currentUser.id;

    console.log(`📨 Marking all unread messages as read for user: ${userId}`);

    const supabase = await createClient();

    // Mark all unread messages as read using the new is_read column
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      console.error('❌ Error marking messages as read:', error);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    const markedCount = data?.length || 0;
    console.log(`✅ Marked ${markedCount} messages as read for user ${userId}`);

    // Broadcast unread count change if any messages were marked as read
    if (markedCount > 0) {
      try {
        console.log('📡 Broadcasting unread count change after mark-read...');
        
        const userChannel = supabase.channel(`unread-messages-${userId}`);
        
        await userChannel.send({
          type: 'broadcast',
          event: 'unread_count_changed',
          payload: {
            userId: userId,
            action: 'mark_read',
            markedCount: markedCount,
            timestamp: new Date().toISOString()
          }
        });
        
        console.log(`📡 Broadcasted mark-read event to user ${userId}`);
        
        // Clean up the channel
        supabase.removeChannel(userChannel);
      } catch (broadcastError) {
        console.error(`❌ Failed to broadcast mark-read event:`, broadcastError);
        // Don't fail the whole operation if broadcast fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      marked_count: markedCount,
      meta: {
        updated_at: new Date().toISOString(),
        user_id: userId,
        method: 'is_read_column'
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in mark-read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
