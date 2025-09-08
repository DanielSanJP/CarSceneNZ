'use server'

import { cache } from 'react'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/utils/supabase/server'
import { getUser } from '@/lib/auth'
import type { InboxMessage, ClubMailData } from '@/types/inbox'
import type { Message } from '@/types/message'

/**
 * Send real-time broadcast for new message
 */
async function broadcastNewMessage(messageId: string, receiverId: string) {
  try {
    const supabase = await createClient();
    
    // Send message broadcast for real-time updates
    const messageChannel = supabase.channel(`inbox-messages-${receiverId}`);
    await messageChannel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        id: messageId,
        receiver_id: receiverId,
        timestamp: new Date().toISOString()
      }
    });

    // Send badge broadcast for unread count updates
    const badgeChannel = supabase.channel(`inbox-badges-${receiverId}`);
    await badgeChannel.send({
      type: 'broadcast',
      event: 'new_message_badge',
      payload: {
        receiver_id: receiverId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Broadcast sent for new message ${messageId} to user ${receiverId}`);
  } catch (error) {
    console.error('Error sending broadcast for new message:', error);
    // Don't throw - broadcast failure shouldn't break message creation
  }
}

/**
 * Get user's inbox messages with enhanced club context
 */
export const getUserInboxMessages = cache(async (userId?: string): Promise<InboxMessage[]> => {
  try {
    const supabase = await createClient()
    const currentUser = userId ? { id: userId } : await getUser()

    // Optimized query - removed receiver JOIN (redundant), selected only needed fields
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        subject,
        message,
        message_type,
        created_at,
        updated_at,
        sender:users!messages_sender_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('receiver_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error getting inbox messages:', error)
      return []
    }

    // Transform basic messages to inbox messages with enhanced context
    return data?.map((msg): InboxMessage => {
      // Handle sender array (Supabase returns array even for single JOIN)
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      
      // Create a properly typed message object for helper functions
      const typedMessage = {
        ...msg,
        sender,
        receiver: undefined // Not needed anymore since we removed the JOIN
      }
      
      return {
        ...msg,
        sender,
        receiver: undefined, // Not needed for inbox view
        // Use the new message_type column directly from database
        message_type: msg.message_type || 'general',
        // Parse metadata from subject/message if it exists - handle both join requests and invitations
        club_id: extractClubIdFromMessage(typedMessage) || extractClubInvitationMetadata(typedMessage)?.club_id,
        club_name: extractClubNameFromMessage(typedMessage) || extractClubInvitationMetadata(typedMessage)?.club_name,
        metadata: parseMessageMetadata(typedMessage) as InboxMessage['metadata'] // Type assertion to handle the metadata mismatch
      }
    }) || []
  } catch (error) {
    console.error('Error getting inbox messages:', error)
    return []
  }
})

/**
 * Send a club join request
 */
export async function sendClubJoinRequest(
  clubId: string,
  message: string = "I would like to join your club."
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const user = await getUser()

    // Get club details and leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, leader_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return { success: false, error: 'Club not found' }
    }

    // Allow multiple requests - users can send follow-up messages
    // Removed the existing request check to allow multiple requests

    // Create the join request message - clean format for display
    const subject = `Join Request from ${user.username}`

    // Store metadata separately in a JSON field if your database supports it,
    // or use a more structured approach. For now, we'll append metadata at the end
    // in a way that can be parsed but won't be displayed to users
    const messageWithMetadata = `${message}

<!-- METADATA:CLUB_JOIN_REQUEST:${JSON.stringify({
  club_id: clubId,
  club_name: club.name,
  user_id: user.id,
  username: user.username,
  status: 'pending'
})} -->`

      const { data: insertedMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: club.leader_id,
          subject,
          message: messageWithMetadata,
          message_type: 'club_join_request'
        })
        .select('id')
        .single()

    if (messageError) {
      console.error('Error sending join request:', messageError)
      return { success: false, error: 'Failed to send join request' }
    }

    // Send real-time broadcast for the new message
    if (insertedMessage?.id) {
      await broadcastNewMessage(insertedMessage.id, club.leader_id);
    }

    // Revalidate unread count specifically for the club leader
    revalidateTag(`unread-messages-${club.leader_id}`)

    return { success: true }
  } catch (error) {
    console.error('Error sending club join request:', error)
    return { success: false, error: 'Failed to send join request' }
  }
}

/**
 * Handle club join request actions (approve/reject)
 */
export async function handleJoinRequestAction(
  messageId: string,
  action: 'approve' | 'reject',
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const currentUser = await getUser()

    // Verify the current user is the club leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club || club.leader_id !== currentUser.id) {
      return { success: false, error: 'You are not authorized to handle this request' }
    }

    if (action === 'approve') {
      // Add user to club using helper function
      const addResult = await addMemberToClub(supabase, clubId, userId)
      if (!addResult.success) {
        return addResult
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
        userId,
        `Welcome to ${clubData?.name}!`,
        `Congratulations! Your request to join ${clubData?.name} has been approved. Welcome to the club!`
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
        userId,
        `${clubData?.name} - Join Request Update`,
        `Thank you for your interest in ${clubData?.name}. Unfortunately, we cannot accept your membership request at this time.`
      )
    }

    // Delete the original join request message
    await deleteProcessedMessage(supabase, messageId, 'join request')

    // Mark the original request message as read - Remove this since read column doesn't exist
    // await supabase
    //   .from('messages')
    //   .update({ read: true })
    //   .eq('id', messageId)

    // Revalidate unread count specifically for the user who submitted the request
    revalidateTag(`unread-messages-${userId}`)
    
    // Revalidate inbox messages for the current user (club leader) to refresh the UI
    revalidateTag(`inbox-messages-${currentUser.id}`)

    return { success: true }
  } catch (error) {
    console.error('Error handling join request action:', error)
    return { success: false, error: 'Failed to process request' }
  }
}

/**
 * Send message to all club members
 */
export async function sendClubMail(mailData: ClubMailData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const user = await getUser()

    // Verify user is club leader or co-leader
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', mailData.club_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || !['leader', 'co-leader'].includes(membership.role)) {
      return { success: false, error: 'You are not authorized to send club mail' }
    }

    // Get all club members (including the sender)
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', mailData.club_id)

    if (membersError) {
      return { success: false, error: 'Failed to get club members' }
    }

    if (!members || members.length === 0) {
      return { success: false, error: 'No members found in club' }
    }

    // Create messages for all members
    const messages = members.map(member => ({
      sender_id: user.id,
      receiver_id: member.user_id,
      subject: mailData.subject,
      message: mailData.message,
      message_type: 'club_announcement'
    }))

    const { data: insertedMessages, error: sendError } = await supabase
      .from('messages')
      .insert(messages)
      .select('id, receiver_id')

    if (sendError) {
      console.error('Error sending club mail:', sendError)
      return { success: false, error: 'Failed to send messages' }
    }

    // Send real-time broadcasts for all new messages
    if (insertedMessages && insertedMessages.length > 0) {
      for (const message of insertedMessages) {
        await broadcastNewMessage(message.id, message.receiver_id);
      }
    }

    // Revalidate unread count for all club members who received messages
    members.forEach(member => {
      revalidateTag(`unread-messages-${member.user_id}`)
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending club mail:', error)
    return { success: false, error: 'Failed to send club mail' }
  }
}

/**
 * Mark message as read - DISABLED: read column doesn't exist in database
 */
export async function markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
  // This function is disabled because the messages table doesn't have a 'read' column
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = messageId;
  return { success: true }
}

/**
 * Delete message
 */
export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const user = await getUser()

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('receiver_id', user.id)

    if (error) {
      return { success: false, error: 'Failed to delete message' }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete message' }
  }
}

// Helper functions
function extractClubIdFromMessage(msg: Message): string | undefined {
  const metadataMatch = msg.message.match(/<!-- METADATA:CLUB_JOIN_REQUEST:({.*?}) -->/)
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1])
      return metadata.club_id
    } catch {
      return undefined
    }
  }
  return undefined
}

function extractClubNameFromMessage(msg: Message): string | undefined {
  const metadataMatch = msg.message.match(/<!-- METADATA:CLUB_JOIN_REQUEST:({.*?}) -->/)
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1])
      return metadata.club_name
    } catch {
      return undefined
    }
  }
  return undefined
}

interface ClubJoinRequestMetadata {
  club_id: string;
  club_name: string;
  user_id: string;
  username: string;
  status: string;
}

interface ClubInvitationMetadata {
  club_id: string;
  club_name: string;
  inviter_id: string;
  inviter_username: string;
  target_user_id: string;
  status: string;
}

function parseMessageMetadata(msg: Message): { club_join_request?: ClubJoinRequestMetadata; club_invitation?: ClubInvitationMetadata } | undefined {
  const joinRequestMatch = msg.message.match(/<!-- METADATA:CLUB_JOIN_REQUEST:({.*?}) -->/)
  const invitationMatch = msg.message.match(/<!-- METADATA:CLUB_INVITATION:({.*?}) -->/)
  
  const result: { club_join_request?: ClubJoinRequestMetadata; club_invitation?: ClubInvitationMetadata } = {}
  
  if (joinRequestMatch) {
    try {
      const metadata = JSON.parse(joinRequestMatch[1])
      result.club_join_request = metadata
    } catch {
      // Ignore parse errors
    }
  }
  
  if (invitationMatch) {
    try {
      const metadata = JSON.parse(invitationMatch[1])
      result.club_invitation = metadata
    } catch {
      // Ignore parse errors
    }
  }
  
  return Object.keys(result).length > 0 ? result : undefined
}

function extractClubInvitationMetadata(msg: Message): ClubInvitationMetadata | undefined {
  const metadataMatch = msg.message.match(/<!-- METADATA:CLUB_INVITATION:({.*?}) -->/)
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1])
      return metadata
    } catch {
      return undefined
    }
  }
  return undefined
}

// Common helper functions to reduce duplication  
async function deleteProcessedMessage(supabase: Awaited<ReturnType<typeof createClient>>, messageId: string, messageType: string): Promise<void> {
  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (deleteError) {
    console.error(`Error deleting ${messageType} message:`, deleteError)
    // Don't throw error here since the main action succeeded
  }
}

async function sendClubNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
      message_type: 'club_announcement'
    })
}

async function addMemberToClub(supabase: Awaited<ReturnType<typeof createClient>>, clubId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { error: memberError } = await supabase
    .from('club_members')
    .insert({
      club_id: clubId,
      user_id: userId,
      role: 'member'
    })

  if (memberError) {
    console.error('Error adding club member:', memberError)
    return { success: false, error: 'Failed to add member to club' }
  }

  return { success: true }
}

/**
 * Get count of unread messages for a user
 * Messages are considered unread if they were created after the user's last_seen_inbox timestamp
 */
export const getUnreadMessageCount = cache(async (userId?: string): Promise<number> => {
  try {
    const supabase = await createClient()
    const currentUser = userId ? { id: userId } : await getUser()

    if (!currentUser?.id) {
      return 0
    }

    // First get the user's last_seen_inbox timestamp
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_seen_inbox')
      .eq('id', currentUser.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return 0
    }

    // If user has never visited inbox, all messages are unread
    const lastSeenInbox = userData.last_seen_inbox

    // Count messages created after last_seen_inbox timestamp
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', currentUser.id)
      .gt('created_at', lastSeenInbox || '1970-01-01T00:00:00Z')

    if (error) {
      console.error('Error counting unread messages:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error)
    return 0
  }
})

/**
 * Update user's last_seen_inbox timestamp to mark all current messages as "read"
 * Call this when user visits the inbox page
 */
export async function markInboxAsRead(userId?: string): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    const currentUser = userId ? { id: userId } : await getUser()

    if (!currentUser?.id) {
      return { success: false }
    }

    const { error } = await supabase
      .from('users')
      .update({ last_seen_inbox: new Date().toISOString() })
      .eq('id', currentUser.id)

    if (error) {
      console.error('Error updating last_seen_inbox:', error)
      return { success: false }
    }

    // No revalidation during render - Next.js 15 doesn't allow it
    // The badge will update on next navigation when cache refreshes
    return { success: true }
  } catch (error) {
    console.error('Error in markInboxAsRead:', error)
    return { success: false }
  }
}

/**
 * Server Action wrapper that can safely call revalidateTag
 * Use this instead of markInboxAsRead from server components
 */
export async function markInboxAsReadAction(): Promise<{ success: boolean }> {
  'use server'
  
  const result = await markInboxAsRead()
  
  if (result.success) {
    const currentUser = await getUser()
    if (currentUser) {
      // This is safe to call from a server action
      revalidateTag(`unread-messages-${currentUser.id}`)
    }
  }
  
  return result
}

/**
 * Get clubs where user is a leader (for inviting others)
 */
export const getUserLeaderClubs = cache(async (userId?: string) => {
  try {
    const supabase = await createClient()
    const currentUser = userId ? { id: userId } : await getUser()

    if (!currentUser?.id) {
      return []
    }

    // Get leader memberships with club data
    const { data: memberships, error } = await supabase
      .from('club_members')
      .select(`
        club_id,
        role,
        clubs (
          id,
          name,
          description,
          banner_image_url,
          club_type,
          location,
          created_at
        )
      `)
      .eq('user_id', currentUser.id)
      .eq('role', 'leader')

    if (error) {
      console.error('Error getting user leader clubs:', error)
      return []
    }

    if (!memberships || memberships.length === 0) {
      return []
    }

    // Get member counts for each club
    const clubsWithMemberCount = await Promise.all(
      (memberships || []).map(async (membership: { club_id: string; role: string; clubs: unknown }) => {
        // Handle both single object and array response from Supabase
        const club = Array.isArray(membership.clubs) 
          ? membership.clubs[0] 
          : membership.clubs
        
        if (!club) {
          return null
        }

        const { count } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id)

        return {
          id: club.id,
          name: club.name,
          description: club.description,
          banner_image_url: club.banner_image_url,
          club_type: club.club_type,
          location: club.location,
          created_at: club.created_at,
          memberCount: count || 0
        }
      })
    )

    return clubsWithMemberCount.filter(Boolean)
  } catch (error) {
    console.error('Error getting user leader clubs:', error)
    return []
  }
})

/**
 * Send club invitation to a user
 */
export async function sendClubInvitation(
  targetUserId: string,
  clubId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const currentUser = await getUser()

    // Verify the current user is a leader of the club
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single()

    if (membershipError || !membership || membership.role !== 'leader') {
      return { success: false, error: 'You are not authorized to send invitations for this club' }
    }

    // Get club details
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return { success: false, error: 'Club not found' }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', targetUserId)
      .single()

    if (existingMember) {
      return { success: false, error: 'User is already a member of this club' }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', currentUser.id)
      .eq('receiver_id', targetUserId)
      .eq('message_type', 'club_invitation')
      .ilike('message', `%${clubId}%`)
      .single()

    if (existingInvitation) {
      return { success: false, error: 'An invitation to this club has already been sent to this user' }
    }

    // Create metadata for the invitation
    const metadata = {
      club_id: clubId,
      club_name: club.name,
      inviter_id: currentUser.id,
      inviter_username: currentUser.username,
      target_user_id: targetUserId,
      status: 'pending'
    }

    const messageWithMetadata = `${message || `You've been invited to join ${club.name}!`}\n\n<!-- METADATA:CLUB_INVITATION:${JSON.stringify(metadata)} -->`

    // Send the invitation message
    const { data: insertedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: targetUserId,
        subject: `Invitation to join ${club.name}`,
        message: messageWithMetadata,
        message_type: 'club_invitation'
      })
      .select('id')
      .single()

    if (messageError) {
      console.error('Error sending club invitation:', messageError)
      return { success: false, error: 'Failed to send invitation' }
    }

    // Send real-time broadcast for the new invitation
    if (insertedMessage?.id) {
      await broadcastNewMessage(insertedMessage.id, targetUserId);
    }

    // Revalidate unread count for the target user
    revalidateTag(`unread-messages-${targetUserId}`)

    return { success: true }
  } catch (error) {
    console.error('Error sending club invitation:', error)
    return { success: false, error: 'Failed to send invitation' }
  }
}

/**
 * Handle club invitation response (accept/reject)
 */
export async function handleClubInvitation(
  messageId: string,
  action: 'accept' | 'reject',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _clubId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _inviterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const currentUser = await getUser()

    // Verify the message exists and belongs to the current user
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('receiver_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .single()

    if (messageError || !message) {
      return { success: false, error: 'Invitation not found' }
    }

    // Extract metadata from the message
    const metadata = extractClubInvitationMetadata(message)
    if (!metadata) {
      return { success: false, error: 'Invalid invitation format' }
    }

    // Use the club ID from metadata instead of the parameter
    const actualClubId = metadata.club_id
    const actualInviterId = metadata.inviter_id

    // Get club details
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', actualClubId)
      .single()

    if (clubError || !club) {
      console.error('Club query error:', clubError)
      return { success: false, error: 'Club not found' }
    }

    if (action === 'accept') {
      // Add user to club using helper function
      const addResult = await addMemberToClub(supabase, actualClubId, currentUser.id)
      if (!addResult.success) {
        return addResult
      }

      // Send confirmation message to the inviter
      await sendClubNotification(
        supabase,
        currentUser.id,
        actualInviterId,
        `${currentUser.username} joined ${club.name}`,
        `Great news! ${currentUser.username} has accepted your invitation and joined ${club.name}.`
      )
    }
    // For reject: Just delete the invitation silently (like Clash of Clans)
    // No notification sent to the inviter

    // Delete the original invitation message
    await deleteProcessedMessage(supabase, messageId, 'club invitation')

    // Revalidate relevant caches
    revalidateTag(`unread-messages-${currentUser.id}`)
    revalidateTag(`unread-messages-${actualInviterId}`)

    return { success: true }
  } catch (error) {
    console.error('Error handling club invitation:', error)
    return { success: false, error: 'Failed to process invitation' }
  }
}
