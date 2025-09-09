import { NextRequest, NextResponse } from 'next/server';
import { getUserLeaderClubs, sendClubInvitation } from '@/lib/server/inbox';
import { getUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { targetUserId, clubId, message } = await request.json();

    if (!targetUserId || !clubId) {
      return NextResponse.json(
        { error: 'Target user ID and club ID are required' },
        { status: 400 }
      );
    }

    const result = await sendClubInvitation(targetUserId, clubId, message);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in club invitation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
