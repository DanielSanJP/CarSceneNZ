import type { Message } from './message';

export interface InboxMessage extends Message {
  message_type?: 'general' | 'club_join_request' | 'club_announcement' | 'club_invitation' | 'system';
  club_id?: string;
  club_name?: string;
  metadata?: {
    club_join_request?: {
      club_id: string;
      club_name: string;
      user_id: string;
      username: string;
      status: 'pending' | 'approved' | 'rejected';
    };
    club_announcement?: {
      club_id: string;
      club_name: string;
    };
    club_invitation?: {
      club_id: string;
      club_name: string;
      inviter_id: string;
      inviter_username: string;
      target_user_id: string;
      status: 'pending' | 'accepted' | 'rejected';
    };
  };
}

export interface ClubJoinRequest {
  id: string;
  club_id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  club?: {
    id: string;
    name: string;
    banner_image_url?: string;
  };
  user?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface ClubMailData {
  subject: string;
  message: string;
  club_id: string;
  sender_id: string;
}

export interface MessageAction {
  type: 'approve_join' | 'reject_join' | 'mark_read' | 'delete';
  message_id: string;
  club_id?: string;
  user_id?: string;
}
