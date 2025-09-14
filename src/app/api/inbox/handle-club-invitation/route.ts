import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { messageId, action, clubId, inviterId } = await request.json();

    // Validate required parameters
    if (!messageId || !action || !clubId || !inviterId) {
      return NextResponse.json(
        { error: 'Missing required parameters: messageId, action, clubId, inviterId' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept or reject' },
        { status: 400 }
      );
    }

    const authUser = await requireAuth();
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Verify the invitation belongs to the current user
    const { data: invitation, error: invitationError } = await supabase
      .from('messages')
      .select('id, receiver_id, sender_id, club_id')
      .eq('id', messageId)
      .eq('receiver_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Get club information for response
    const { data: club } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', clubId)
      .single();

    const clubName = club?.name || 'Unknown Club';

    if (action === 'accept') {
      // Add user to club
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: currentUser.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('❌ Error adding member to club:', memberError);
        return NextResponse.json(
          { error: 'Failed to join club' },
          { status: 500 }
        );
      }

      // Send confirmation message to inviter
      await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: inviterId,
          subject: `${currentUser.username} joined ${clubName}`,
          message: `${currentUser.username} has accepted your invitation and joined ${clubName}.`,
          message_type: 'club_notification',
          club_id: clubId,
          created_at: new Date().toISOString()
        });
    }

    // Delete the invitation message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('receiver_id', currentUser.id);

    if (deleteError) {
      console.error('❌ Error deleting invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to process invitation' },
        { status: 500 }
      );
    }

    // Invalidate cache for both users
    revalidateTag(`user-${currentUser.id}-inbox`);
    revalidateTag(`user-${currentUser.id}-unread`);
    revalidateTag(`user-${inviterId}-inbox`);
    revalidateTag(`user-${inviterId}-unread`);

    // Also invalidate club-related caches if accepted
    if (action === 'accept') {
      revalidateTag(`club-${clubId}-members`);
      revalidateTag(`user-${currentUser.id}-clubs`);
    }

    console.log(`✅ Club invitation ${action}ed successfully`);

    return NextResponse.json({ 
      success: true,
      action,
      clubName 
    });

  } catch (error) {
    console.error('❌ Error handling club invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}