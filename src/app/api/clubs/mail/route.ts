import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in' },
        { status: 401 }
      );
    }

    const mailData = await request.json();
    const { club_id, subject, message } = mailData;

    if (!club_id || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Club ID, subject, and message are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is club leader or admin
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role, club:clubs(name)')
      .eq('club_id', club_id)
      .eq('user_id', currentUser.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !['leader', 'admin'].includes(membership.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to send club mail' },
        { status: 403 }
      );
    }

    // Get all club members
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', club_id)
      .neq('user_id', currentUser.id); // Exclude sender

    if (membersError) {
      return NextResponse.json(
        { success: false, error: 'Failed to get club members' },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No members to send mail to' },
        { status: 400 }
      );
    }

    // Send message to all members
    const clubName =
      (membership as { club?: { name?: string } }).club?.name || 'Club';
    const messages = members.map((member) => ({
      receiver_id: member.user_id,
      sender_id: currentUser.id,
      subject: `[${clubName}] ${subject}`,
      message: message,
      message_type: 'club_mail',
      created_at: new Date().toISOString(),
    }));

    const { error: mailError } = await supabase
      .from('messages')
      .insert(messages);

    if (mailError) {
      console.error('Error sending club mail:', mailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send club mail' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club mail API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
