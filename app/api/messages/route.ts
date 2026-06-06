/**
 * app/api/messages/route.ts — Message thread API.
 *
 * GET  /api/messages  — Returns all threads for the current user, with
 *                       participant info, last message preview, and unread count.
 * POST /api/messages  — Creates or opens an existing thread between the current
 *                       user and a recipient. Sends an opening message if provided.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getThreadsForUser, getOrCreateThread, sendMessage, getUserById } from '@/lib/queries';

export async function GET() {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (currentUser.user as any).id;
    const threads = getThreadsForUser(userId);
    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId, listingId, content } = await req.json();
    const currentUserId = parseInt((currentUser.user as any).id);
    const recipientUserId = parseInt(recipientId);

    if (currentUserId === recipientUserId) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    const recipientUser = getUserById(recipientUserId);
    if (!recipientUser) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 400 });
    }

    // Get or create a thread between these two users
    const threadId = getOrCreateThread(currentUserId, recipientUserId, listingId || null);

    // If an opening message was provided, send it immediately
    if (content?.trim()) {
      sendMessage(threadId, currentUserId, content);
    }

    return NextResponse.json({ threadId });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
  }
}
