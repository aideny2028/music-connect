/**
 * app/api/marketplace/route.ts — Marketplace instrument listings API.
 *
 * GET  /api/marketplace  — Returns paginated active instrument listings with optional
 *                          filters (category, condition, price, location, search).
 * POST /api/marketplace  — Creates a new instrument listing for the authenticated user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMarketplaceItems, createMarketplaceItem } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const condition = searchParams.get('condition') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const location = searchParams.get('location') || undefined;
  const sort = searchParams.get('sort') || 'newest';
  const q = searchParams.get('q') || undefined;
  const sellerId = searchParams.get('sellerId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '24');
  const offset = parseInt(searchParams.get('offset') || '0');

  const { items, total } = getMarketplaceItems({ category, condition, minPrice, maxPrice, location, sellerId, q, sort, limit, offset });

  return NextResponse.json({ items, total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, category, brand, condition, price, is_negotiable, location_district } = body;

  if (!title || !description || !category || !condition || price == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const newId = createMarketplaceItem({
    sellerId: userId,
    title,
    description,
    category,
    brand: brand || null,
    condition,
    price: Number(price),
    isNegotiable: is_negotiable ? 1 : 0,
    locationDistrict: location_district || null,
  });

  return NextResponse.json({ id: newId }, { status: 201 });
}
