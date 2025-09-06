export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  message: string;
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
