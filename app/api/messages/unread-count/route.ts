/**
 * API route to fetch the current user's total unread message count.
 * Used by the navigation bar to display the unread badge.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUnreadMessageCount } from '@/lib/queries';

export async function GET() {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ count: 0 });

    const currentUserId = (currentUser.user as any).id;
    const unreadMessageCount = getUnreadMessageCount(currentUserId);
    return NextResponse.json({ count: unreadMessageCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}
