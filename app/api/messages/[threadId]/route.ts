/**
 * API route for individual thread operations.
 * GET: Fetch all messages in a thread (marks them as read).
 * POST: Send a new message to the thread.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getThreadForUser, getMessagesInThread, sendMessage } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { threadId } = await params;
    const currentUserId = (currentUser.user as any).id;

    const thread = getThreadForUser(threadId, currentUserId);
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

    // Fetch messages and mark unread ones as read in a single function
    const messageList = getMessagesInThread(threadId, currentUserId);
    return NextResponse.json({ thread, messages: messageList });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { threadId } = await params;
    const currentUserId = (currentUser.user as any).id;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Verify user is a participant before allowing them to send
    const thread = getThreadForUser(threadId, currentUserId);
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 403 });

    const newMessageId = sendMessage(threadId, currentUserId, content);
    return NextResponse.json({ id: newMessageId });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
