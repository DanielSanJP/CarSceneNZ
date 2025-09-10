import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to send a join request' },
        { status: 401 }
      );
    }

    const { clubId, message } = await request.json();

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: 'Club ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, leader_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this club' },
        { status: 400 }
      );
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', club.leader_id)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_join_request')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'You have already sent a join request to this club' },
        { status: 400 }
      );
    }

    // Send join request message
    const { error: messageError } = await supabase.from('messages').insert({
      receiver_id: club.leader_id,
      sender_id: currentUser.id,
      subject: `Join Request for ${club.name}`,
      message: message || `${currentUser.username} wants to join your club "${club.name}"`,
      message_type: 'club_join_request',
      created_at: new Date().toISOString(),
    });

    if (messageError) {
      console.error('Error sending join request:', messageError);
      return NextResponse.json(
        { success: false, error: 'Failed to send join request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club join request API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send join request' },
      { status: 500 }
    );
  }
}
