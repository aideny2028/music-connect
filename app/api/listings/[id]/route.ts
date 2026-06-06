/**
 * API route for individual listing operations.
 * GET: Fetch a single listing by ID (public).
 * PATCH: Update a listing (owner only).
 * DELETE: Soft-delete a listing (owner only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getListingById, updateListing, softDeleteListing } from '@/lib/queries';
import getDb from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listing = getListingById(id);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    // Increment view count each time the listing detail is loaded
    const db = getDb();
    db.prepare('UPDATE listings SET view_count = view_count + 1 WHERE id = ?').run(id);
    // Return the listing regardless of status — the client page handles deleted/paused display
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) {
      return NextResponse.json({ error: 'You must be logged in to edit listings' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (currentUser.user as any).id;
    const body = await req.json();

    const updateSucceeded = updateListing(id, userId, body);
    if (!updateSucceeded) {
      return NextResponse.json({ error: 'You do not have permission to edit this listing' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) {
      return NextResponse.json({ error: 'You must be logged in to delete listings' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (currentUser.user as any).id;
    const deleteSucceeded = softDeleteListing(id, userId);

    if (!deleteSucceeded) {
      return NextResponse.json({ error: 'You do not have permission to delete this listing' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
