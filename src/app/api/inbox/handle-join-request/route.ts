import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { getAuthUser } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const messageData = {
      sender_id: senderId,
      receiver_id: receiverId,
      subject,
      message,
      message_type: 'club_notification' as const,
      club_id: clubId || null,
      created_at: new Date().toISOString(),
      is_read: false as boolean // Explicitly cast as boolean
    };

    console.log('📤 Inserting notification message:', {
      ...messageData,
      message: messageData.message.substring(0, 50) + '...' // Truncate for logging
    });

    const { error } = await supabase
      .from('messages')
      .insert(messageData);

    if (error) {
      console.error('❌ Error sending club notification:', error);
      return { success: false, error: `Failed to send notification: ${error.message}` };
    }

    console.log('✅ Club notification sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error in sendClubNotification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
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
    const body = await request.json();
    console.log('📥 Join request handler received:', body);
    
    const { messageId, action, senderId } = body;

    if (!messageId || !action || !senderId) {
      console.error('❌ Missing required parameters:', { messageId: !!messageId, action: !!action, senderId: !!senderId });
      return NextResponse.json(
        { error: 'Missing required parameters: messageId, action, senderId' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      console.error('❌ Invalid action:', action);
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      );
    }

    const supabase = await createClient()
    const currentUser = await getAuthUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the original join request message to extract club_id
    const { data: originalMessage, error: messageError } = await supabase
      .from('messages')
      .select('club_id, message_type')
      .eq('id', messageId)
      .eq('message_type', 'club_join_request')
      .single();

    if (messageError || !originalMessage) {
      console.error('❌ Original join request message not found:', messageError);
      return NextResponse.json(
        { error: 'Join request message not found' },
        { status: 404 }
      );
    }

    let clubId = originalMessage.club_id;

    // Fallback: If club_id is null in the message (older messages), try to get it from request body
    if (!clubId) {
      console.log('⚠️ Original message has null club_id, checking request body for fallback');
      clubId = body.clubId;
      
      if (!clubId) {
        console.error('❌ No club_id found in original message or request body');
        return NextResponse.json(
          { error: 'Unable to determine club ID for this join request' },
          { status: 400 }
        );
      }
      
      console.log('✅ Using fallback club ID from request:', clubId);
    } else {
      console.log('✅ Found club ID from original message:', clubId);
    }

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
      console.log('🔄 Processing approval for:', { clubId, senderId, currentUserId: currentUser.id });
      
      // Add user to club
      const addResult = await addMemberToClub(supabase, clubId, senderId)
      if (!addResult.success) {
        console.error('❌ Failed to add member to club:', addResult.error);
        return NextResponse.json(
          { error: addResult.error || 'Failed to add member to club' },
          { status: 500 }
        );
      }

      console.log('✅ Member added to club successfully');

      // Get club name for notifications
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      console.log('🔄 Sending welcome notification...');
      
      // Send confirmation message to the user
      const notificationResult = await sendClubNotification(
        supabase,
        currentUser.id,
        senderId,
        `Welcome to ${clubData?.name}!`,
        `Congratulations! Your request to join ${clubData?.name} has been approved. Welcome to the club!`,
        clubId
      )

      if (!notificationResult.success) {
        console.error('❌ Failed to send welcome notification:', notificationResult.error)
        // Don't fail the entire request if notification fails
      } else {
        console.log('✅ Welcome notification sent successfully');
      }
    } else {
      // Get club name for rejection message
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      // Send rejection message to the user
      const rejectionResult = await sendClubNotification(
        supabase,
        currentUser.id,
        senderId,
        `${clubData?.name} - Join Request Update`,
        `Thank you for your interest in ${clubData?.name}. Unfortunately, we cannot accept your membership request at this time.`,
        clubId
      )

      if (!rejectionResult.success) {
        console.error('Failed to send rejection notification:', rejectionResult.error)
        // Don't fail the entire request if notification fails
      }
    }

    // Delete the original join request message
    await deleteProcessedMessage(supabase, messageId, 'join request')

    // ✅ Real-time notifications handled automatically by database trigger
    console.log(`✅ Join request ${action} processed - database trigger will notify affected users`);

    // Critical: Invalidate cache after processing join request
    try {
      if (action === 'approve') {
        // Invalidate the club detail page cache so member list updates
        revalidateTag(`club-${clubId}`);
        revalidateTag('clubs');
        // Invalidate user-specific club data cache for the new member
        revalidateTag(`user-${senderId}-clubs`);
        
        // Invalidate related pages
        revalidatePath(`/clubs/${clubId}`);
        revalidatePath('/clubs/my-clubs');
        revalidatePath('/clubs');
        
        console.log(`🔄 Cache invalidated for club ${clubId} and user ${senderId} after join request approval`);
      }
      
      // Invalidate inbox caches for both users
      revalidateTag(`user-${currentUser.id}-inbox`);
      revalidateTag(`user-${senderId}-inbox`);
      
    } catch (revalidateError) {
      console.error('❌ Error during cache revalidation:', revalidateError);
      // Don't fail the request if revalidation fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling join request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
