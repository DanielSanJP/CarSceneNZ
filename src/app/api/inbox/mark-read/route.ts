import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`📨 Marking inbox as read for user: ${userId}`);

    // Create Supabase client with request context to maintain auth
    const supabase = await createClient();
    
    // Debug: Check if we have an authenticated user in this context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log(`🔍 MARK-READ AUTH - User: ${authUser?.id}, Error:`, authError);
    console.log(`🔍 MARK-READ - Requested userId: ${userId}`);
    console.log(`🔍 MARK-READ - Auth user matches requested: ${authUser?.id === userId}`);

    // Update the user's last_seen_inbox timestamp to now
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('users')
      .update({ last_seen_inbox: now })
      .eq('id', userId)
      .select('last_seen_inbox')
      .single();

    if (error) {
      console.error('❌ Error updating last_seen_inbox:', error);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    console.log(`✅ Inbox marked as read successfully for user ${userId}`, data);
    console.log(`🕐 Updated last_seen_inbox to: ${now}`);

    return NextResponse.json({ 
      success: true, 
      last_seen_inbox: now,
      meta: {
        updated_at: now,
        user_id: userId
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in mark-read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
