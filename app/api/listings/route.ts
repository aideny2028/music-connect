/**
 * app/api/listings/route.ts — REST API for listing operations.
 *
 * GET  /api/listings  — Returns paginated active listings with optional
 *                       filters (instrument, location, price, level, format,
 *                       type, free-text search) and sort options.
 * POST /api/listings  — Creates a new listing for the authenticated user.
 *                       Validates all required fields before inserting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveListings, createListing } from '@/lib/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Extract all filter parameters from the query string
    const filters = {
      instrument: searchParams.get('instrument') || undefined,
      location: searchParams.get('location') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      level: searchParams.get('level') || undefined,
      format: searchParams.get('format') || undefined,
      type: searchParams.get('type') || undefined,
      q: searchParams.get('q') || undefined,
      sort: searchParams.get('sort') || 'newest',
      limit: parseInt(searchParams.get('limit') || '24'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const { filteredListings, totalCount } = getActiveListings(filters);
    return NextResponse.json({ listings: filteredListings, total: totalCount });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getServerSession(authOptions);
    if (!currentUser?.user) {
      return NextResponse.json({ error: 'You must be logged in to create a listing' }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, description, instrument, location_district, lesson_format, rate, rate_unit, student_level, teaching_languages } = body;

    // Validate required fields before inserting
    if (!type) return NextResponse.json({ error: 'Listing type is required' }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    if (!instrument) return NextResponse.json({ error: 'Instrument is required' }, { status: 400 });
    if (!lesson_format) return NextResponse.json({ error: 'Lesson format is required' }, { status: 400 });

    const userId = (currentUser.user as any).id;
    const newListingId = createListing({
      userId,
      type,
      title: title.trim(),
      description: description.trim(),
      instrument,
      location_district: location_district || null,
      lesson_format,
      rate: rate ? Number(rate) : null,
      rate_unit: rate_unit || null,
      student_level: student_level || null,
      teaching_languages: teaching_languages || null,
    });

    return NextResponse.json({ id: newListingId, message: 'Listing created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
