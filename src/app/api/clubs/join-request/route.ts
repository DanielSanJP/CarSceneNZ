import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Use getAuthUser() for API routes - returns null if not authenticated
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    const { clubId, message } = await request.json();

    console.log('📥 Join request received:', { clubId, message, clubIdType: typeof clubId });

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: 'Club ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if club exists and get its type
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, leader_id, club_type')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      );
    }

    // Validate club allows join requests
    if (club.club_type === 'closed') {
      return NextResponse.json(
        { success: false, error: 'This club is closed and not accepting new members' },
        { status: 403 }
      );
    }

    if (club.club_type === 'open') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This is an open club. You can join directly without requesting permission.' 
        },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this club' },
        { status: 400 }
      );
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', club.leader_id)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_join_request')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'You have already sent a join request to this club' },
        { status: 400 }
      );
    }

    // Send join request message
    console.log('💾 About to insert message with clubId:', clubId, 'for club:', club.name);
    
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        receiver_id: club.leader_id,
        sender_id: currentUser.id,
        subject: `Join Request for ${club.name}`,
        message: message || `${currentUser.username} wants to join your club "${club.name}"`,
        message_type: 'club_join_request',
        club_id: clubId, // Now include club_id in the message
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (messageError) {
      console.error('Error sending join request:', messageError);
      return NextResponse.json(
        { success: false, error: 'Failed to send join request' },
        { status: 500 }
      );
    }

    console.log(`✅ Join request sent successfully from user ${currentUser.id} to club ${clubId}`);

    // Invalidate inbox-related cache tags for the club leader
    const { revalidateTag } = await import('next/cache');
    revalidateTag('inbox');
    revalidateTag('messages');
    revalidateTag(`user-${club.leader_id}-inbox`);
    revalidateTag(`user-${club.leader_id}-unread`);

    // ✅ Real-time notification handled automatically by database trigger
    console.log(`✅ Join request sent - database trigger will notify leader ${club.leader_id}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club join request API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send join request' },
      { status: 500 }
    );
  }
}
