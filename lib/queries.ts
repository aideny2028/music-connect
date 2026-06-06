// Database query functions. The actual SQL lives in db/queries.sql — this file
// reads that file at startup, parses it into a name -> SQL map called Q, and
// the functions below grab queries from Q by name.

import fs from 'fs';
import path from 'path';
import getDb from './db';

// Read queries.sql once at startup and parse it into a name → SQL map
const QUERIES_PATH = path.join(process.cwd(), 'db', 'queries.sql');
const QUERIES_FILE = fs.readFileSync(QUERIES_PATH, 'utf8');

function parseQueries(text: string): Record<string, string> {
  // Each query starts with a line like "-- name: foo" so we split on that
  const out: Record<string, string> = {};
  const parts = text.split(/^-- name:\s*/m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    const name = part.slice(0, newline).trim();
    // Drop any leading comment-only lines and trailing semicolon
    const body = part.slice(newline + 1)
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim()
      .replace(/;\s*$/, '');
    out[name] = body;
  }
  return out;
}

const Q = parseQueries(QUERIES_FILE);


// USERS

export function getUserByEmail(email: string) {
  const db = getDb();
  // Look up a user by email for login
  return db.prepare(Q.get_user_by_email).get(email) as any | undefined;
}

export function getUserByUsername(username: string) {
  const db = getDb();
  return db.prepare(Q.get_user_by_username).get(username) as any | undefined;
}

export function getUserById(id: number | string) {
  const db = getDb();
  return db.prepare(Q.get_user_by_id).get(id) as any | undefined;
}

export function createUser(data: {
  name: string;
  email: string;
  password_hash: string;
  username: string;
  role: string;
}) {
  const db = getDb();
  const result = db.prepare(Q.create_user).run(
    data.name, data.email, data.password_hash, data.username, data.role
  );
  return result.lastInsertRowid as number;
}

// used during register so two people can't pick the same email/username
export function isEmailTaken(email: string): boolean {
  const db = getDb();
  return !!db.prepare(Q.is_email_taken).get(email);
}

export function isUsernameTaken(username: string): boolean {
  const db = getDb();
  return !!db.prepare(Q.is_username_taken).get(username);
}

export function updateUserProfile(userId: number | string, data: Record<string, any>) {
  const db = getDb();
  const allowedFields = ['name', 'bio', 'location_district', 'instruments', 'experience_level', 'language_pref', 'avatar_url'];
  const updates: string[] = [];
  const values: unknown[] = [];
  // build the SET clause from whichever fields the user actually changed
  for (const field of allowedFields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  }
  if (updates.length === 0) return;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
}

export function updateUserPassword(userId: number | string, newPasswordHash: string) {
  const db = getDb();
  db.prepare(Q.update_user_password).run(newPasswordHash, userId);
}


// TEACHER PROFILES

export function getTeacherProfile(userId: number | string) {
  const db = getDb();
  // Get the teacher profile row for this user
  return db.prepare(Q.get_teacher_profile).get(userId) as any | null;
}

export function upsertTeacherProfile(userId: number | string, data: {
  hourly_rate?: number | null;
  lesson_format?: string;
  student_levels?: string;
  qualifications?: string | null;
  lesson_description?: string | null;
  teaching_languages?: string;
}) {
  const db = getDb();
  // if the user already has a teacher profile, update it. otherwise insert a new one.
  const existing = db.prepare(Q.teacher_profile_exists).get(userId);
  if (existing) {
    db.prepare(Q.update_teacher_profile).run(
      data.hourly_rate ?? null,
      data.lesson_format ?? 'in_person',
      data.student_levels ?? '',
      data.qualifications ?? null,
      data.lesson_description ?? null,
      data.teaching_languages ?? '',
      userId
    );
  } else {
    db.prepare(Q.create_teacher_profile).run(
      userId,
      data.hourly_rate ?? null,
      data.lesson_format ?? 'in_person',
      data.student_levels ?? '',
      data.qualifications ?? null,
      data.lesson_description ?? null,
      data.teaching_languages ?? ''
    );
  }
}


// LISTINGS

export function getActiveListings(filters: {
  instrument?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  level?: string;
  format?: string;
  type?: string;
  q?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();
  const conditions: string[] = ["l.status = 'active'"];
  const params: unknown[] = [];

  // add a WHERE condition for each filter the user picked
  if (filters.instrument) { conditions.push('l.instrument = ?'); params.push(filters.instrument); }
  if (filters.location)   { conditions.push('l.location_district = ?'); params.push(filters.location); }
  if (filters.minPrice != null) { conditions.push('(l.rate >= ? OR l.rate IS NULL)'); params.push(filters.minPrice); }
  if (filters.maxPrice != null) { conditions.push('(l.rate <= ? OR l.rate IS NULL)'); params.push(filters.maxPrice); }
  if (filters.level)      { conditions.push('l.student_level = ?'); params.push(filters.level); }
  if (filters.format)     { conditions.push('l.lesson_format = ?'); params.push(filters.format); }
  if (filters.type)       { conditions.push('l.type = ?'); params.push(filters.type); }
  if (filters.q) { conditions.push('l.title LIKE ?'); params.push(`%${filters.q}%`); }

  const orderBy = filters.sort === 'priceLow'  ? 'l.rate ASC NULLS LAST'
    : filters.sort === 'priceHigh' ? 'l.rate DESC NULLS LAST'
    : filters.sort === 'rating'    ? 'avg_rating DESC NULLS LAST'
    : 'l.created_at DESC';

  const whereClause = conditions.join(' AND ');
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  // see get_active_listings_base in queries.sql — same SQL with the WHERE built up
  const filteredListings = db.prepare(`
    SELECT l.*,
      u.name AS user_name, u.username AS user_username, u.avatar_url AS user_avatar_url,
      ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.reviewee_id = l.user_id), 1) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = l.user_id) AS review_count
    FROM listings l
    JOIN users u ON l.user_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  // get the total count so the search page can show "X listings found"
  const totalCount = (db.prepare(
    `SELECT COUNT(*) AS count FROM listings l WHERE ${whereClause}`
  ).get(...params) as { count: number }).count;

  return { filteredListings, totalCount };
}

export function getListingById(id: number | string) {
  const db = getDb();
  return db.prepare(Q.get_listing_by_id).get(id) as any | undefined;
}

export function getListingsByUser(userId: number | string) {
  const db = getDb();
  return db.prepare(Q.get_listings_by_user).all(userId) as any[];
}

export function getActiveListingsByUser(userId: number | string) {
  const db = getDb();
  return db.prepare(Q.get_active_listings_by_user).all(userId) as any[];
}

export function createListing(data: {
  userId: number | string;
  type: string;
  title: string;
  description: string;
  instrument: string;
  location_district?: string | null;
  lesson_format: string;
  rate?: number | null;
  rate_unit?: string | null;
  student_level?: string | null;
  teaching_languages?: string | null;
}) {
  const db = getDb();
  const result = db.prepare(Q.create_listing).run(
    data.userId, data.type, data.title, data.description, data.instrument,
    data.location_district ?? null, data.lesson_format,
    data.rate ?? null, data.rate_unit ?? null,
    data.student_level ?? null, data.teaching_languages ?? null
  );
  return result.lastInsertRowid as number;
}

export function updateListing(id: number | string, userId: number | string, data: Record<string, any>): boolean {
  const db = getDb();
  // check the owner first so people can't edit other users' listings
  const listingOwner = db.prepare(Q.get_listing_owner).get(id) as { user_id: number } | undefined;
  if (!listingOwner || String(listingOwner.user_id) !== String(userId)) return false;

  const allowedFields = ['type', 'title', 'description', 'instrument', 'location_district', 'lesson_format', 'rate', 'rate_unit', 'student_level', 'teaching_languages', 'status'];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const field of allowedFields) {
    if (field in data) { updates.push(`${field} = ?`); values.push(data[field] ?? null); }
  }
  if (updates.length === 0) return true;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  // Dynamic UPDATE built from update_listing_template in queries.sql
  db.prepare(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return true;
}

export function softDeleteListing(id: number | string, userId: number | string): boolean {
  const db = getDb();
  // same ownership check as updateListing
  const listingOwner = db.prepare(Q.get_listing_owner).get(id) as { user_id: number } | undefined;
  if (!listingOwner || String(listingOwner.user_id) !== String(userId)) return false;
  // set status = 'deleted' instead of really deleting so message history still works
  db.prepare(Q.soft_delete_listing).run(id);
  return true;
}


// MESSAGES

export function getOrCreateThread(participant1Id: number, participant2Id: number, listingId?: number | null): number {
  const db = getDb();
  // check both orderings in case the other user started the thread first
  const existingThread = db.prepare(Q.find_thread_between).get(
    participant1Id, participant2Id, participant2Id, participant1Id
  ) as { id: number } | undefined;

  if (existingThread) return existingThread.id;

  const result = db.prepare(Q.create_thread).run(participant1Id, participant2Id, listingId ?? null);
  return result.lastInsertRowid as number;
}

export function getThreadsForUser(userId: number | string) {
  const db = getDb();
  return db.prepare(Q.get_threads_for_user).all(userId, userId, userId) as any[];
}

export function getMessagesInThread(threadId: number | string, currentUserId: number | string) {
  const db = getDb();
  // mark anything sent by the other person as read since the user is looking at it now
  db.prepare(Q.mark_messages_read).run(threadId, currentUserId);
  return db.prepare(Q.get_messages_in_thread).all(threadId) as any[];
}

export function getThreadForUser(threadId: number | string, userId: number | string) {
  const db = getDb();
  // only returns the thread if the user is actually one of the two participants
  return db.prepare(Q.get_thread_for_user).get(threadId, userId, userId) as any | undefined;
}

export function sendMessage(threadId: number | string, senderId: number | string, content: string) {
  const db = getDb();
  const result = db.prepare(Q.insert_message).run(threadId, senderId, content.trim());
  // bump the thread timestamp so the inbox sorts this thread to the top
  db.prepare(Q.bump_thread_timestamp).run(threadId);
  return result.lastInsertRowid as number;
}

// used for the unread count badge in the header
export function getUnreadMessageCount(userId: number | string): number {
  const db = getDb();
  const result = db.prepare(Q.get_unread_message_count).get(userId, userId, userId) as { unreadMessageCount: number };
  return result.unreadMessageCount;
}


// REVIEWS

export function getReviewsForUser(userId: number | string) {
  const db = getDb();
  const reviewList = db.prepare(Q.get_reviews_for_user).all(userId) as any[];
  const avgResult = db.prepare(Q.get_average_rating_for_user).get(userId) as { averageRating: number | null };
  return { reviewList, averageRating: avgResult.averageRating };
}

export function createReview(reviewerId: number | string, revieweeId: number | string, rating: number, comment?: string, listingId?: number | null): 'created' | 'duplicate' | 'self_review' {
  const db = getDb();
  if (String(reviewerId) === String(revieweeId)) return 'self_review';
  try {
    db.prepare(Q.create_review).run(reviewerId, revieweeId, listingId ?? null, rating, comment ?? null);
    return 'created';
  } catch (e: any) {
    // the UNIQUE constraint throws an error if you try to review the same person twice
    if (e.message?.includes('UNIQUE')) return 'duplicate';
    throw e;
  }
}


// MARKETPLACE

export function getMarketplaceItems(filters: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sellerId?: string;
  q?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();
  const conditions: string[] = ["i.status = 'active'"];
  const params: unknown[] = [];

  if (filters.category) { conditions.push('i.category = ?'); params.push(filters.category); }
  if (filters.condition) { conditions.push('i.condition = ?'); params.push(filters.condition); }
  if (filters.minPrice != null) { conditions.push('i.price >= ?'); params.push(filters.minPrice); }
  if (filters.maxPrice != null) { conditions.push('i.price <= ?'); params.push(filters.maxPrice); }
  if (filters.location) { conditions.push('i.location_district = ?'); params.push(filters.location); }
  if (filters.sellerId) { conditions.push('i.seller_id = ?'); params.push(filters.sellerId); }
  if (filters.q) { conditions.push('i.title LIKE ?'); params.push(`%${filters.q}%`); }

  const orderBy = filters.sort === 'priceLow' ? 'i.price ASC'
    : filters.sort === 'priceHigh' ? 'i.price DESC'
    : 'i.created_at DESC';

  const whereStr = conditions.join(' AND ');
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  const items = db.prepare(`
    SELECT i.*, u.name AS seller_name, u.username AS seller_username, u.avatar_url AS seller_avatar
    FROM instruments_for_sale i
    JOIN users u ON i.seller_id = u.id
    WHERE ${whereStr}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = (db.prepare(
    `SELECT COUNT(*) AS count FROM instruments_for_sale i WHERE ${whereStr}`
  ).get(...params) as { count: number }).count;

  return { items, total };
}

export function getMarketplaceItemById(id: number | string) {
  const db = getDb();
  return db.prepare(Q.get_marketplace_item_by_id).get(id) as any | undefined;
}

export function createMarketplaceItem(data: {
  sellerId: number | string;
  title: string;
  description: string;
  category: string;
  brand?: string | null;
  condition: string;
  price: number;
  isNegotiable?: number;
  locationDistrict?: string | null;
}) {
  const db = getDb();
  const result = db.prepare(Q.create_marketplace_item).run(
    data.sellerId, data.title, data.description, data.category,
    data.brand ?? null, data.condition, data.price,
    data.isNegotiable ?? 0, data.locationDistrict ?? null
  );
  return result.lastInsertRowid as number;
}
