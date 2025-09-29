import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
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
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        receiver_id: targetUserId,
        sender_id: currentUser.id,
        subject: `Invitation to join ${clubName}`,
        message: message || `You've been invited to join ${clubName}! We'd love to have you as a member.`,
        message_type: 'club_invitation',
        club_id: clubId, // Now include club_id in the message
        created_at: new Date().toISOString(),
      });

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

    // ✅ Real-time notification handled automatically by database trigger
    console.log(`✅ Club invitation sent - database trigger will notify user ${targetUserId}`);

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