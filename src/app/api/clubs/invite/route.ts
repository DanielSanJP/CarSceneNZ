import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag } from 'next/cache';

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

    const { targetUserId, clubId, message } = await request.json();

    if (!targetUserId || !clubId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID and club ID are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending club invitation from user ${currentUser.id} to user ${targetUserId} for club ${clubId}`);

    const supabase = await createClient();

    // Verify current user is club leader or admin
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role, club:clubs(name)')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !['leader', 'admin'].includes(membership.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to send invitations for this club' },
        { status: 403 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if target user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', targetUserId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this club' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', targetUserId)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation already sent to this user' },
        { status: 400 }
      );
    }

    // Get club name for invitation
    const clubName = (membership as { club?: { name?: string } }).club?.name || 'Club';

    // Send invitation message
    const { data: insertedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        receiver_id: targetUserId,
        sender_id: currentUser.id,
        subject: `Invitation to join ${clubName}`,
        message: message || `You've been invited to join ${clubName}! We'd love to have you as a member.`,
        message_type: 'club_invitation',
        club_id: clubId, // Now include club_id in the message
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (messageError) {
      console.error('Error sending club invitation:', messageError);
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation' },
        { status: 500 }
      );
    }

    console.log(`✅ Club invitation sent successfully to user ${targetUserId}`);

    // Invalidate inbox-related cache tags for the recipient
    revalidateTag('inbox');
    revalidateTag('messages');
    revalidateTag(`user-${targetUserId}-inbox`);
    revalidateTag(`user-${targetUserId}-unread`);

    // Send real-time notification to the recipient
    try {
      const messageForBroadcast = {
        id: insertedMessage.id,
        receiver_id: targetUserId,
        sender_id: currentUser.id,
        subject: `Invitation to join ${clubName}`,
        message: message || `You've been invited to join ${clubName}! We'd love to have you as a member.`,
        message_type: 'club_invitation',
        created_at: new Date().toISOString(),
        sender_username: currentUser.username,
        sender_display_name: currentUser.display_name,
        sender_profile_image_url: currentUser.profile_image_url,
        club_name: clubName,
      };

      // Send new message broadcast for React Query
      await supabase.channel(`inbox-messages-${targetUserId}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: messageForBroadcast,
      });

      // Send badge count broadcast for InboxProvider
      await supabase.channel(`inbox-badges-${targetUserId}`).send({
        type: 'broadcast',
        event: 'new_message_badge',
        payload: {
          receiver_id: targetUserId,
          message_type: 'club_invitation',
          club_name: clubName,
        },
      });

      console.log(`✅ Real-time notification sent to user ${targetUserId}`);
    } catch (broadcastError) {
      console.error('Error sending real-time notification:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${targetUser.username}` 
    });

  } catch (error) {
    console.error('Error in club invitation API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}