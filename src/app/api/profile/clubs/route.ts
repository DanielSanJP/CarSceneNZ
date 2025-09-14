import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

async function getUserLeaderClubs(userId: string) {
  try {
    const supabase = await createClient()

    if (!userId) {
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
      .eq('user_id', userId)
      .eq('role', 'leader')

    if (error) {
      console.error('Error getting user leader clubs:', error)
      return []
    }

    // Transform the data to flatten club information
    return memberships?.map(membership => {
      const club = Array.isArray(membership.clubs) ? membership.clubs[0] : membership.clubs
      return {
        id: club?.id,
        name: club?.name,
        description: club?.description,
        banner_image_url: club?.banner_image_url,
        club_type: club?.club_type,
        location: club?.location,
        created_at: club?.created_at,
        memberCount: 0 // Could be populated with a separate query if needed
      }
    }).filter(club => club.id) || []
  } catch (error) {
    console.error('Error in getUserLeaderClubs:', error)
    return []
  }
}

async function sendClubInvitation(
  targetUserId: string,
  clubId: string,
  message: string = '',
  currentUser: { id: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get club info and verify leadership
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, leader_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return { success: false, error: 'Club not found' }
    }

    if (club.leader_id !== currentUser.id) {
      return { success: false, error: 'You are not authorized to send invitations for this club' }
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

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', targetUserId)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .single()

    if (existingInvitation) {
      return { success: false, error: 'Invitation already sent to this user' }
    }

    // Send invitation
    const { error: inviteError } = await supabase
      .from('messages')
      .insert({
        receiver_id: targetUserId,
        sender_id: currentUser.id,
        subject: `Invitation to join ${club.name}`,
        message: message || `You've been invited to join the club "${club.name}"`,
        message_type: 'club_invitation',
        created_at: new Date().toISOString()
      })

    if (inviteError) {
      return { success: false, error: 'Failed to send invitation' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending club invitation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const leaderClubsRaw = await getUserLeaderClubs(currentUser.id);
    const leaderClubs = leaderClubsRaw.map((club) =>
      club
        ? {
            id: club.id,
            name: club.name,
            description: club.description || "",
            image_url: club.banner_image_url || null,
            memberCount: club.memberCount,
          }
        : null
    );

    return NextResponse.json({ leaderClubs });

  } catch (error) {
    console.error('Error in leader clubs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const { targetUserId, clubId, message } = await request.json();

    if (!targetUserId || !clubId) {
      return NextResponse.json(
        { error: 'Target user ID and club ID are required' },
        { status: 400 }
      );
    }

    const result = await sendClubInvitation(targetUserId, clubId, message, currentUser);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in club invitation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
