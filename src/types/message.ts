// New message structure - stores message content once
export interface Message {
  id: string;
  sender_id: string;
  subject?: string;
  message: string;
  message_type?: 'general' | 'club_join_request' | 'club_announcement' | 'club_invitation' | 'club_notification' | 'system';
  club_id?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

// Recipient-specific read status
export interface MessageRecipient {
  id: string;
  message_id: string;
  recipient_id: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// Combined view for inbox display (replaces old Message interface)
export interface MessageWithRecipient extends Message {
  recipient_id: string;
  is_read: boolean;
  read_at?: string;
  // Flat sender fields for easier access
  sender_username?: string;
  sender_display_name?: string;
  sender_profile_image_url?: string;
  // Club info
  club_name?: string;
}

// For backward compatibility - TODO: Remove after migration
export interface LegacyMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  message: string;
  message_type?: 'general' | 'club_join_request' | 'club_announcement' | 'club_invitation' | 'club_notification' | 'system';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  receiver?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}
