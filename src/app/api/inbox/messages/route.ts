import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`📬 Fetching inbox messages for user: ${userId}`);

    // Create Supabase client with request context to maintain auth
    const supabase = await createClient();
    
    // Debug: Check if we have an authenticated user in this context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log(`🔍 API AUTH - User: ${authUser?.id}, Error:`, authError);
    console.log(`🔍 API - Requested userId: ${userId}`);
    console.log(`🔍 API - Auth user matches requested: ${authUser?.id === userId}`);
    
    // If no authenticated user but we have a userId, there might be an auth context issue
    if (!authUser) {
      console.log(`⚠️ No authenticated user in API context, but proceeding with query...`);
    }
    
    // Use direct query instead of RPC to avoid type mismatch issues
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        subject,
        message,
        message_type,
        club_id,
        created_at,
        updated_at,
        sender:sender_id (
          id,
          username,
          display_name,
          profile_image_url
        ),
        club:club_id (
          id,
          name
        )
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Query error:', error);
      throw new Error(`Query failed: ${error.message}`);
    }

    console.log(`✅ Retrieved ${messages?.length || 0} messages`);

    // Transform the data to handle Supabase's array returns and add flat fields for compatibility
    const transformedMessages = messages?.map((msg) => {
      // Safely extract sender data (handle both array and object cases)
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      const club = Array.isArray(msg.club) ? msg.club[0] : msg.club;
      
      return {
        ...msg,
        // Normalize nested objects
        sender: sender || null,
        club: club || null,
        // Add flat fields for backward compatibility
        sender_username: sender?.username || null,
        sender_display_name: sender?.display_name || null,
        sender_profile_image_url: sender?.profile_image_url || null,
        club_name: club?.name || null,
      };
    }) || [];

    return NextResponse.json(
      {
        messages: transformedMessages,
        meta: {
          generated_at: new Date().toISOString(),
          cache_key: `inbox_messages_${userId}`,
        },
      },
      {
        headers: {
          // Enable caching for 1 minute, but allow stale-while-revalidate for better UX
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );

  } catch (error) {
    console.error("❌ Error fetching inbox messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbox messages" },
      { status: 500 }
    );
  }
}