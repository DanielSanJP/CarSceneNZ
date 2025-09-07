export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  message: string;
  message_type?: 'general' | 'club_join_request' | 'club_announcement' | 'club_invitation' | 'system';
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
