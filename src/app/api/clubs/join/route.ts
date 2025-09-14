import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { clubId, userId } = await request.json();

    if (!clubId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Club ID and user ID are required' },
        { status: 400 }
      );
    }

    // Only allow users to join themselves (security check)
    if (userId !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You can only join yourself to clubs' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Get club info to check type and permissions
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, club_type')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, message: 'Club not found' },
        { status: 404 }
      );
    }

    // Security check: Only allow direct joining for open clubs
    if (club.club_type !== 'open') {
      const typeMessages = {
        'invite': 'This is an invite-only club. Please request to join or wait for an invitation.',
        'closed': 'This club is currently closed and not accepting new members.'
      };
      
      return NextResponse.json(
        { 
          success: false, 
          message: typeMessages[club.club_type as keyof typeof typeMessages] || 'You cannot join this club directly.' 
        },
        { status: 403 }
      );
    }

    // Check if already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing membership:', checkError);
      return NextResponse.json(
        { success: false, message: 'Failed to check membership status' },
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: 'Already a member of this club' },
        { status: 400 }
      );
    }

    // Add user to club
    const { error: insertError } = await supabase.from('club_members').insert({
      club_id: clubId,
      user_id: userId,
      role: 'member',
    });

    if (insertError) {
      console.error('Error joining club:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to join club' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club join API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
