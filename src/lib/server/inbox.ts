'use server'

import { cache } from 'react'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/utils/supabase/server'
import { getUser } from '@/lib/auth'
import type { InboxMessage, ClubMailData } from '@/types/inbox'
import type { Message } from '@/types/message'

/**
 * Get user's inbox messages with enhanced club context
 */
export const getUserInboxMessages = cache(async (userId?: string): Promise<InboxMessage[]> => {
  try {
    const supabase = await createClient()
    const currentUser = userId ? { id: userId } : await getUser()

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        ),
        receiver:users!messages_receiver_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('receiver_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting inbox messages:', error)
      return []
    }

    // Transform basic messages to inbox messages with enhanced context
    return data?.map((msg): InboxMessage => ({
      ...msg,
      // Use the new message_type column directly from database
      message_type: msg.message_type || 'general',
      // Parse metadata from subject/message if it exists
      club_id: extractClubIdFromMessage(msg),
      club_name: extractClubNameFromMessage(msg),
      metadata: parseMessageMetadata(msg)
    })) || []
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

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: club.leader_id,
          subject,
          message: messageWithMetadata,
          message_type: 'club_join_request'
        })

    if (messageError) {
      console.error('Error sending join request:', messageError)
      return { success: false, error: 'Failed to send join request' }
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
      // Add user to club
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

      // Send confirmation message to the user
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          subject: `Welcome to ${clubData?.name}!`,
          message: `Congratulations! Your request to join ${clubData?.name} has been approved. Welcome to the club!`,
          message_type: 'club_announcement'
        })

      // Delete the original join request message from the database (since it's been processed)
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) {
        console.error('Error deleting join request message:', deleteError)
        // Don't return error here since the main action (approval) succeeded
      }
    } else {
      // Send rejection message to the user
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single()

      await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          subject: `${clubData?.name} - Join Request Update`,
          message: `Thank you for your interest in ${clubData?.name}. Unfortunately, we cannot accept your membership request at this time.`,
          message_type: 'club_announcement'
        })

      // Delete the original join request message from the database
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) {
        console.error('Error deleting join request message:', deleteError)
        // Don't return error here since the main action (rejection) succeeded
      }
    }

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

    const { error: sendError } = await supabase
      .from('messages')
      .insert(messages)

    if (sendError) {
      console.error('Error sending club mail:', sendError)
      return { success: false, error: 'Failed to send messages' }
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

function parseMessageMetadata(msg: Message): { club_join_request?: ClubJoinRequestMetadata } | undefined {
  const metadataMatch = msg.message.match(/<!-- METADATA:CLUB_JOIN_REQUEST:({.*?}) -->/)
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1])
      return {
        club_join_request: metadata
      }
    } catch {
      return undefined
    }
  }
  return undefined
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
 * Version that can be used inside after() callback without cookies
 * Requires userId to be passed explicitly
 */
export async function markInboxAsReadWithUserId(userId: string): Promise<{ success: boolean }> {
  try {
    // Create a simple client that doesn't use cookies (for after() callback)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    )

    const { error } = await supabase
      .from('users')
      .update({ last_seen_inbox: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating last_seen_inbox:', error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in markInboxAsReadWithUserId:', error)
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
