import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const { clubId, userId } = await request.json();

    if (!clubId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Club ID and user ID are required' },
        { status: 400 }
      );
    }

    // Only allow users to leave themselves (security check)
    if (userId !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You can only remove yourself from clubs' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Don't allow leader to leave without transferring leadership
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (club?.leader_id === userId) {
      return NextResponse.json(
        { success: false, message: 'Club leader must transfer leadership before leaving' },
        { status: 400 }
      );
    }

    // Remove user from club
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving club:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to leave club' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in club leave API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
