import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import getDb from '@/lib/db';
import { getMarketplaceItemById } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getMarketplaceItemById(id);

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const userId = (session.user as any).id;
  const item = db.prepare('SELECT * FROM instruments_for_sale WHERE id = ?').get(id) as any;

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String(item.seller_id) !== String(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const fields = ['title', 'description', 'category', 'brand', 'condition', 'price', 'is_negotiable', 'location_district', 'status'];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of fields) {
    if (field in body) {
      updates.push(`${field} = ?`);
      values.push(body[field] ?? null);
    }
  }
  if (!updates.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE instruments_for_sale SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const userId = (session.user as any).id;
  const item = db.prepare('SELECT * FROM instruments_for_sale WHERE id = ?').get(id) as any;

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String(item.seller_id) !== String(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  db.prepare("UPDATE instruments_for_sale SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
