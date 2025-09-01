import { createClient } from '@/lib/utils/supabase/client'
import type { Message } from '@/types/message'

export async function getAllMessages(): Promise<Message[]> {
  try {
    const supabase = createClient()

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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all messages:', error)
      return []
    }

    return data?.map(message => ({
      id: message.id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      subject: message.subject,
      message: message.message,
      read: message.read,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        display_name: message.sender.display_name || message.sender.username,
        profile_image_url: message.sender.profile_image_url,
      },
      receiver: {
        id: message.receiver.id,
        username: message.receiver.username,
        display_name: message.receiver.display_name || message.receiver.username,
        profile_image_url: message.receiver.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting all messages:', error)
    return []
  }
}

export async function getMessagesByUser(userId: string): Promise<Message[]> {
  try {
    const supabase = createClient()

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
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting messages by user:', error)
      return []
    }

    return data?.map(message => ({
      id: message.id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      subject: message.subject,
      message: message.message,
      read: message.read,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        display_name: message.sender.display_name || message.sender.username,
        profile_image_url: message.sender.profile_image_url,
      },
      receiver: {
        id: message.receiver.id,
        username: message.receiver.username,
        display_name: message.receiver.display_name || message.receiver.username,
        profile_image_url: message.receiver.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting messages by user:', error)
    return []
  }
}

export async function getConversation(senderId: string, receiverId: string): Promise<Message[]> {
  try {
    const supabase = createClient()

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
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error getting conversation:', error)
      return []
    }

    return data?.map(message => ({
      id: message.id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      subject: message.subject,
      message: message.message,
      read: message.read,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        display_name: message.sender.display_name || message.sender.username,
        profile_image_url: message.sender.profile_image_url,
      },
      receiver: {
        id: message.receiver.id,
        username: message.receiver.username,
        display_name: message.receiver.display_name || message.receiver.username,
        profile_image_url: message.receiver.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting conversation:', error)
    return []
  }
}

export async function sendMessage(messageData: Omit<Message, 'id' | 'created_at' | 'updated_at' | 'read' | 'sender' | 'receiver'>): Promise<Message | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        subject: messageData.subject,
        message: messageData.message,
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    return await getMessageById(data.id)
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

export async function getMessageById(messageId: string): Promise<Message | null> {
  try {
    const supabase = createClient()

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
      .eq('id', messageId)
      .single()

    if (error || !data) {
      console.error('Error getting message by ID:', error)
      return null
    }

    return {
      id: data.id,
      sender_id: data.sender_id,
      receiver_id: data.receiver_id,
      subject: data.subject,
      message: data.message,
      read: data.read,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sender: {
        id: data.sender.id,
        username: data.sender.username,
        display_name: data.sender.display_name || data.sender.username,
        profile_image_url: data.sender.profile_image_url,
      },
      receiver: {
        id: data.receiver.id,
        username: data.receiver.username,
        display_name: data.receiver.display_name || data.receiver.username,
        profile_image_url: data.receiver.profile_image_url,
      }
    }
  } catch (error) {
    console.error('Error getting message by ID:', error)
    return null
  }
}

export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .update({
        read: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking message as read:', error)
    return false
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting message:', error)
    return false
  }
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const supabase = createClient()

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false)

    return count || 0
  } catch (error) {
    console.error('Error getting unread message count:', error)
    return 0
  }
}
