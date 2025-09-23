import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// Ensure this route is always dynamic and never cached
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use authenticated user instead of accepting userId parameter
    const currentUser = await requireAuth();
    const userId = currentUser.id;

    console.log(`🔢 Fetching unread count for user: ${userId}`);

    const supabase = await createClient();

    // Count unread messages using the new is_read column
    const { count, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

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
        method: 'is_read_column',
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
