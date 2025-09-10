import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { getUser } from '@/lib/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

async function addMemberToClub(supabase: SupabaseClient, clubId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return { success: false, error: 'User is already a member of this club' }
    }

    // Add member to club
    const { error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error adding member to club:', error)
      return { success: false, error: 'Failed to add member to club' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addMemberToClub:', error)
    return { success: false, error: 'Failed to add member to club' }
  }
}

async function sendClubNotification(
  supabase: SupabaseClient,
  senderId: string,
  receiverId: string,
  subject: string,
  message: string
): Promise<void> {
  await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      subject,
      message,
      message_type: 'club_notification',
      created_at: new Date().toISOString()
    })
}

async function deleteProcessedMessage(supabase: SupabaseClient, messageId: string, messageType: string): Promise<void> {
  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (deleteError) {
    console.error(`Error deleting ${messageType} message:`, deleteError)
  }
}

export async function POST(request: Request) {
  try {
    const { messageId, action, clubId, inviterId } = await request.json();

    if (!messageId || !action || !clubId || !inviterId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept or reject' },
        { status: 400 }
      );
    }

    const supabase = await createClient()
    const currentUser = await getUser()

    // Get the invitation message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('receiver_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Add user to club
      const addResult = await addMemberToClub(supabase, clubId, currentUser.id)
      if (!addResult.success) {
        return NextResponse.json(
          { error: addResult.error || 'Failed to join club' },
          { status: 500 }
        );
      }

      // Get club name for notifications
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      // Send confirmation message to the inviter
      await sendClubNotification(
        supabase,
        currentUser.id,
        inviterId,
        `${currentUser.username} joined ${clubData?.name}`,
        `Great news! ${currentUser.username} has accepted your invitation and joined ${clubData?.name}.`
      )
    }
    // For reject: Just delete the invitation silently (like most apps do)

    // Delete the original invitation message
    await deleteProcessedMessage(supabase, messageId, 'club invitation')

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
