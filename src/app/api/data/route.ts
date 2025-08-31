import { NextResponse } from 'next/server';
import { users, cars, events, clubs, carLikes } from '@/data';

export async function GET() {
  try {
    return NextResponse.json({
      users,
      cars,
      events,
      clubs,
      carLikes,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}