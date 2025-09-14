import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to load user profile' },
        { status: 500 }
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

    console.log(`📧 Sending club mail from user ${currentUser.id} to club ${club_id}`);

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

    // Get all club members (including sender)
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', club_id); // Include sender so they receive a copy

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
      message_type: 'club_announcement',
      club_id: club_id, // Now include club_id in the message
      created_at: new Date().toISOString(),
    }));

    console.log('🔍 DEBUG: About to insert messages:', JSON.stringify(messages, null, 2));

    const { data: insertedMessages, error: mailError } = await supabase
      .from('messages')
      .insert(messages)
      .select('id, receiver_id');

    if (mailError) {
      console.error('❌ Error sending club mail:', mailError);
      console.error('❌ Detailed error:', JSON.stringify(mailError, null, 2));
      return NextResponse.json(
        { success: false, error: 'Failed to send club mail' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully inserted messages:', insertedMessages);

    console.log(`✅ Club mail sent successfully to ${members.length} members (including sender)`);

    // Invalidate inbox-related cache tags for all recipients (including sender)
    revalidateTag('inbox');
    revalidateTag('messages');
    members.forEach((member) => {
      revalidateTag(`user-${member.user_id}-inbox`);
      revalidateTag(`user-${member.user_id}-unread`);
    });

    // Revalidate inbox page for real-time updates
    revalidatePath('/inbox');

    // Send real-time notifications to all recipients
    try {
      for (const member of members) {
        // Find the specific message ID for this member
        const memberMessage = insertedMessages?.find(m => m.receiver_id === member.user_id);
        
        if (memberMessage?.id) {
          const messageForBroadcast = {
            id: memberMessage.id,
            receiver_id: member.user_id,
            sender_id: currentUser.id,
            subject: `[${clubName}] ${subject}`,
            message: message,
            message_type: 'club_announcement',
            created_at: new Date().toISOString(),
            sender_username: currentUser.username,
            sender_display_name: currentUser.display_name,
            sender_profile_image_url: currentUser.profile_image_url,
            club_name: clubName,
          };

          // Send new message broadcast for inbox real-time updates
          await supabase.channel(`inbox-messages-${member.user_id}`).send({
            type: 'broadcast',
            event: 'new_message',
            payload: messageForBroadcast,
          });

          // Send badge count broadcast for InboxProvider
          await supabase.channel(`inbox-badges-${member.user_id}`).send({
            type: 'broadcast',
            event: 'new_message_badge',
            payload: {
              receiver_id: member.user_id,
              message_type: 'club_announcement',
              club_name: clubName,
            },
          });
        }
      }
      console.log(`✅ Real-time notifications sent to ${members.length} recipients (including sender)`);
    } catch (broadcastError) {
      console.error('Error sending real-time notifications:', broadcastError);
      // Don't fail the request if broadcasts fail
    }

    return NextResponse.json({ 
      success: true, 
      message: `Club mail sent to ${members.length} members (including yourself)` 
    });

  } catch (error) {
    console.error('Error in club mail API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
