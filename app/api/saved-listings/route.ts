/**
 * app/api/saved-listings/route.ts — Saved/bookmarked listings API.
 *
 * GET    — Returns all listing IDs saved by the current user.
 * POST   — Saves a listing (INSERT OR IGNORE to handle duplicates).
 * DELETE — Removes a saved listing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ savedIds: [] });
    const db = getDb();
    const userId = (currentUser.user as any).id;
    // SELECT all saved listing IDs for this user
    const rows = db.prepare('SELECT listing_id FROM saved_listings WHERE user_id = ?').all(userId) as { listing_id: number }[];
    return NextResponse.json({ savedIds: rows.map(r => r.listing_id) });
  } catch (error) {
    console.error('Failed to fetch saved listings:', error);
    return NextResponse.json({ savedIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { listingId } = await req.json();
    const db = getDb();
    const userId = (currentUser.user as any).id;
    // INSERT OR IGNORE handles the case where listing is already saved
    db.prepare('INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)').run(userId, listingId);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('Failed to save listing:', error);
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { listingId } = await req.json();
    const db = getDb();
    const userId = (currentUser.user as any).id;
    // DELETE the saved listing record
    db.prepare('DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?').run(userId, listingId);
    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error('Failed to unsave listing:', error);
    return NextResponse.json({ error: 'Failed to unsave listing' }, { status: 500 });
  }
}
