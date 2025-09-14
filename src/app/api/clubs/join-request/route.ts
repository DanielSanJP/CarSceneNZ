import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    const { clubId, message } = await request.json();

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
    const { data: insertedMessage, error: messageError } = await supabase
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

    // Send real-time notification to the club leader
    try {
      const messageForBroadcast = {
        id: insertedMessage.id,
        receiver_id: club.leader_id,
        sender_id: currentUser.id,
        subject: `Join Request for ${club.name}`,
        message: message || `${currentUser.username} wants to join your club "${club.name}"`,
        message_type: 'club_join_request',
        created_at: new Date().toISOString(),
        sender_username: currentUser.username,
        sender_display_name: currentUser.display_name,
        sender_profile_image_url: currentUser.profile_image_url,
        club_name: club.name,
      };

      // Send new message broadcast for React Query
      await supabase.channel(`inbox-messages-${club.leader_id}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: messageForBroadcast,
      });

      // Send badge count broadcast for InboxProvider
      await supabase.channel(`inbox-badges-${club.leader_id}`).send({
        type: 'broadcast',
        event: 'new_message_badge',
        payload: {
          receiver_id: club.leader_id,
          message_type: 'club_join_request',
          club_name: club.name,
        },
      });

      console.log(`✅ Real-time notification sent to club leader ${club.leader_id}`);
    } catch (broadcastError) {
      console.error('Error sending real-time notification:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club join request API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send join request' },
      { status: 500 }
    );
  }
}
