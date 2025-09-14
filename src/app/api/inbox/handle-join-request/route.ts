import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
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
  message: string,
  clubId?: string
): Promise<void> {
  await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      subject,
      message,
      message_type: 'club_notification',
      club_id: clubId, // Include club_id if provided
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
    const { messageId, action, clubId, senderId } = await request.json();

    if (!messageId || !action || !clubId || !senderId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      );
    }

    const supabase = await createClient()
    const currentUser = await requireAuth()

    // Verify the current user is the club leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club || club.leader_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'You are not authorized to handle this request' },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Add user to club
      const addResult = await addMemberToClub(supabase, clubId, senderId)
      if (!addResult.success) {
        return NextResponse.json(
          { error: addResult.error || 'Failed to add member to club' },
          { status: 500 }
        );
      }

      // Get club name for notifications
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      // Send confirmation message to the user
      await sendClubNotification(
        supabase,
        currentUser.id,
        senderId,
        `Welcome to ${clubData?.name}!`,
        `Congratulations! Your request to join ${clubData?.name} has been approved. Welcome to the club!`,
        clubId
      )
    } else {
      // Get club name for rejection message
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      // Send rejection message to the user
      await sendClubNotification(
        supabase,
        currentUser.id,
        senderId,
        `${clubData?.name} - Join Request Update`,
        `Thank you for your interest in ${clubData?.name}. Unfortunately, we cannot accept your membership request at this time.`,
        clubId
      )
    }

    // Delete the original join request message
    await deleteProcessedMessage(supabase, messageId, 'join request')

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling join request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
