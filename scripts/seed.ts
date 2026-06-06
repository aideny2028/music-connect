// Fills the database with sample data so the app actually has stuff to show.
// Run with: npm run seed

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'music-connect.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// make sure the tables exist before inserting anything
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    location_district TEXT,
    bio TEXT,
    instruments TEXT NOT NULL DEFAULT '',
    experience_level TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    language_pref TEXT NOT NULL DEFAULT 'en',
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS teacher_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    hourly_rate REAL,
    lesson_format TEXT NOT NULL DEFAULT 'in_person',
    student_levels TEXT NOT NULL DEFAULT '',
    qualifications TEXT,
    lesson_description TEXT,
    teaching_languages TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instrument TEXT NOT NULL,
    location_district TEXT,
    lesson_format TEXT NOT NULL,
    rate REAL,
    rate_unit TEXT,
    student_level TEXT,
    teaching_languages TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS message_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_1_id INTEGER NOT NULL REFERENCES users(id),
    participant_2_id INTEGER NOT NULL REFERENCES users(id),
    listing_id INTEGER REFERENCES listings(id),
    last_message_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL REFERENCES message_threads(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    reviewee_id INTEGER NOT NULL REFERENCES users(id),
    listing_id INTEGER REFERENCES listings(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, reviewee_id)
  );
  CREATE TABLE IF NOT EXISTS instruments_for_sale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    condition TEXT NOT NULL,
    price REAL NOT NULL,
    is_negotiable INTEGER NOT NULL DEFAULT 0,
    location_district TEXT,
    images TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function hashPassword(plaintext: string): string {
  return bcrypt.hashSync(plaintext, 10);
}

function insertUser(data: { name: string; email: string; password: string; username: string; role: string; bio?: string; location?: string; instruments?: string; experience?: string }): number {
  // INSERT OR IGNORE so re-running the seed doesn't crash on duplicates
  db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, username, role, bio, location_district, instruments, experience_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(data.name, data.email, hashPassword(data.password), data.username, data.role, data.bio ?? null, data.location ?? null, data.instruments ?? '', data.experience ?? null);
  const userRecord = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email) as { id: number };
  return userRecord.id;
}

console.log('Seeding database...\n');

// TEACHER ACCOUNTS

const sarahId = insertUser({ name: 'Sarah Chen', email: 'sarah@example.com', password: 'password123', username: 'sarahchen', role: 'teacher', bio: 'Professional pianist with 15 years of teaching experience. ABRSM Grade 8 qualified. I specialise in classical repertoire and exam preparation for students of all ages.', location: 'Wan Chai', instruments: 'Piano', experience: 'professional' });
const michaelId = insertUser({ name: 'Michael Wong', email: 'michael@example.com', password: 'password123', username: 'mikewong', role: 'teacher', bio: 'Guitar teacher specialising in classical, pop, and fingerstyle. Berklee College of Music graduate.', location: 'Mong Kok', instruments: 'Guitar', experience: 'professional' });
const emilyId = insertUser({ name: 'Emily Lau', email: 'emily@example.com', password: 'password123', username: 'emilylau', role: 'teacher', bio: 'Violin teacher and former HKPO member. I teach using Suzuki and traditional methods.', location: 'Central', instruments: 'Violin', experience: 'professional' });
const jasonId = insertUser({ name: 'Jason Hui', email: 'jason@example.com', password: 'password123', username: 'jasonhui', role: 'teacher', bio: 'Drums and percussion specialist with 10 years of live and studio experience. Energetic and fun lessons!', location: 'Tsim Sha Tsui', instruments: 'Drums', experience: 'advanced' });
const lindaId = insertUser({ name: 'Linda Tam', email: 'linda@example.com', password: 'password123', username: 'lindatam', role: 'teacher', bio: 'Professional vocal coach trained in classical and contemporary styles. Former choir director.', location: 'Causeway Bay', instruments: 'Voice', experience: 'professional' });

// demo teacher account for the screencast
const demoTeacherId = insertUser({ name: 'Demo Teacher', email: 'teacher@test.com', password: 'password123', username: 'demoteacher', role: 'teacher', bio: 'This is the demo teacher account for the Music Connect assessment demo. Teaches piano and guitar in Central.', location: 'Central', instruments: 'Piano,Guitar', experience: 'professional' });

const teacherProfileData = [
  { userId: sarahId, rate: 500, format: 'both', levels: 'beginner,intermediate,advanced', qual: 'ABRSM Grade 8, Music Education Diploma (HKU)', desc: 'Comprehensive piano tuition covering technique, theory, and musicality. ABRSM exam prep available.', langs: 'English,Cantonese' },
  { userId: michaelId, rate: 400, format: 'both', levels: 'beginner,intermediate', qual: 'Bachelor of Music, Berklee College of Music', desc: 'Learn acoustic, electric, or classical guitar from beginner chords to advanced technique.', langs: 'English,Cantonese,Mandarin' },
  { userId: emilyId, rate: 600, format: 'in_person', levels: 'beginner,intermediate,advanced', qual: 'Royal Academy of Music, Former HKPO Member', desc: 'Structured violin instruction. Suitable for all ages. Performance coaching available.', langs: 'English,Cantonese' },
  { userId: jasonId, rate: 350, format: 'both', levels: 'beginner,intermediate', qual: 'Trinity College London Grade 8 Drums', desc: 'Fun and energetic drum lessons. Learn popular songs while building solid technique.', langs: 'English,Cantonese' },
  { userId: lindaId, rate: 450, format: 'both', levels: 'beginner,intermediate,advanced', qual: 'Royal Northern College of Music, BMus (Hons)', desc: 'Vocal coaching for pop, classical, and musical theatre. Breath control and performance confidence.', langs: 'English,Cantonese' },
  { userId: demoTeacherId, rate: 400, format: 'both', levels: 'beginner,intermediate,advanced', qual: 'BMus (Hons), Hong Kong Academy for Performing Arts', desc: 'Demo teacher account for the Music Connect assessment. Offers piano and guitar lessons.', langs: 'English,Cantonese' },
];

for (const tp of teacherProfileData) {
  db.prepare('INSERT OR IGNORE INTO teacher_profiles (user_id, hourly_rate, lesson_format, student_levels, qualifications, lesson_description, teaching_languages) VALUES (?, ?, ?, ?, ?, ?, ?)').run(tp.userId, tp.rate, tp.format, tp.levels, tp.qual, tp.desc, tp.langs);
}

// STUDENT ACCOUNTS

const tommyId = insertUser({ name: 'Tommy Lee', email: 'tommy@example.com', password: 'password123', username: 'tommylee', role: 'student', location: 'Mong Kok', instruments: 'Piano' });
const graceId = insertUser({ name: 'Grace Ho', email: 'grace@example.com', password: 'password123', username: 'graceho', role: 'student', location: 'Central', instruments: 'Violin' });
const kevinId = insertUser({ name: 'Kevin Chan', email: 'kevin@example.com', password: 'password123', username: 'kevinchan', role: 'student', location: 'Sha Tin', instruments: 'Guitar' });

// demo student account for the screencast
const demoStudentId = insertUser({ name: 'Demo Student', email: 'student@test.com', password: 'password123', username: 'demostudent', role: 'student', location: 'Wan Chai', instruments: 'Piano' });

// LISTINGS

function insertListing(data: { userId: number; type: string; title: string; desc: string; instrument: string; location?: string | null; format: string; rate?: number | null; unit?: string | null; level?: string | null; langs?: string; status?: string }): number {
  const result = db.prepare('INSERT INTO listings (user_id, type, title, description, instrument, location_district, lesson_format, rate, rate_unit, student_level, teaching_languages, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(data.userId, data.type, data.title, data.desc, data.instrument, data.location ?? null, data.format, data.rate ?? null, data.unit ?? null, data.level ?? null, data.langs ?? 'English,Cantonese', data.status ?? 'active');
  return result.lastInsertRowid as number;
}

// active teacher listings
const listing1 = insertListing({ userId: sarahId, type: 'offering_lessons', title: 'Piano Lessons for All Levels – Wan Chai', desc: 'Professional piano instruction covering classical, pop, and jazz. ABRSM exam preparation available. Flexible scheduling for working adults and children. Trial lesson available on request.', instrument: 'Piano', location: 'Wan Chai', format: 'both', rate: 500, unit: 'hour', level: 'beginner' });
const listing2 = insertListing({ userId: sarahId, type: 'offering_lessons', title: 'Advanced Piano Masterclass', desc: 'For intermediate to advanced students wanting to refine technique and musicality. Repertoire coaching and competition preparation available.', instrument: 'Piano', location: 'Wan Chai', format: 'in_person', rate: 800, unit: 'hour', level: 'advanced' });
const listing3 = insertListing({ userId: michaelId, type: 'offering_lessons', title: 'Guitar Lessons – All Styles Welcome', desc: 'Learn acoustic, electric, or classical guitar. Beginner-friendly structured curriculum. Online lessons available via Zoom.', instrument: 'Guitar', location: 'Mong Kok', format: 'both', rate: 400, unit: 'hour', level: 'beginner' });
const listing4 = insertListing({ userId: michaelId, type: 'offering_lessons', title: 'Fingerstyle Guitar Workshop', desc: 'Specialised sessions for intermediate guitarists wanting to master fingerpicking technique and popular arrangements.', instrument: 'Guitar', location: 'Mong Kok', format: 'both', rate: 350, unit: 'hour', level: 'intermediate' });
const listing5 = insertListing({ userId: emilyId, type: 'offering_lessons', title: 'Violin Lessons – Beginners to Advanced', desc: 'Structured violin instruction using Suzuki and traditional methods. Suitable for children (age 5+) and adults. Former HKPO member with 20 years teaching experience.', instrument: 'Violin', location: 'Central', format: 'in_person', rate: 600, unit: 'hour', level: 'beginner' });
const listing6 = insertListing({ userId: jasonId, type: 'offering_lessons', title: 'Drum Lessons – Fun & Energetic!', desc: 'Learn to play drums the fun way! Cover popular songs while building solid technique and timing. Beginners especially welcome. Electronic kit available for quiet practice.', instrument: 'Drums', location: 'Tsim Sha Tsui', format: 'both', rate: 350, unit: 'hour', level: 'beginner' });
const listing7 = insertListing({ userId: lindaId, type: 'offering_lessons', title: 'Professional Vocal Coaching – All Styles', desc: 'Improve your singing with professional coaching covering pop, classical, musical theatre, and more. Breathing exercises, pitch control, and performance confidence included.', instrument: 'Voice', location: 'Causeway Bay', format: 'both', rate: 450, unit: 'hour', level: 'beginner' });
const listing8 = insertListing({ userId: lindaId, type: 'offering_lessons', title: 'Online Vocal Lessons – Flexible Scheduling', desc: 'Same professional vocal coaching delivered via Zoom. Great for busy professionals and students. Weekday and weekend slots available.', instrument: 'Voice', location: null, format: 'online', rate: 400, unit: 'hour', level: 'beginner' });

// demo teacher's listing for the screencast
const listing9 = insertListing({ userId: demoTeacherId, type: 'offering_lessons', title: 'Piano Lessons – Demo Teacher (Central)', desc: 'This is the demo teacher listing for the Music Connect assessment. I offer professional piano lessons for all levels in Central, HK. Trial lesson available.', instrument: 'Piano', location: 'Central', format: 'both', rate: 400, unit: 'hour', level: 'beginner' });

// student "looking for teacher" listings
const listing10 = insertListing({ userId: tommyId, type: 'looking_for_teacher', title: 'Looking for Piano Teacher in Kowloon', desc: 'Adult beginner looking for a patient piano teacher in the Kowloon area. Evenings and weekends preferred. Budget around HK$300-400/hr.', instrument: 'Piano', location: 'Mong Kok', format: 'in_person', rate: 350, unit: 'hour', level: 'beginner' });
const listing11 = insertListing({ userId: graceId, type: 'looking_for_teacher', title: 'Intermediate Violin Student Seeking Teacher', desc: 'Have been playing violin for 3 years (ABRSM Grade 4). Looking to work towards Grade 6. Prefer Central or online lessons.', instrument: 'Violin', location: 'Central', format: 'both', rate: 500, unit: 'hour', level: 'intermediate' });
const listing12 = insertListing({ userId: kevinId, type: 'looking_for_teacher', title: 'Beginner Guitar Lessons Wanted – Sha Tin', desc: 'Complete beginner wanting to learn acoustic guitar. Interested in popular songs and basic chord progressions. Available weekends in Sha Tin.', instrument: 'Guitar', location: 'Sha Tin', format: 'in_person', level: 'beginner' });

// demo student's listing
const listing13 = insertListing({ userId: demoStudentId, type: 'looking_for_teacher', title: 'Demo Student Looking for Piano Teacher', desc: 'This is the demo student listing for the assessment. Looking for a piano teacher in Hong Kong. Beginner level, available weekends.', instrument: 'Piano', location: 'Wan Chai', format: 'both', rate: 400, unit: 'hour', level: 'beginner' });

// a paused listing (shouldn't show on the browse page — used for testing spec 2)
insertListing({ userId: sarahId, type: 'offering_lessons', title: 'Piano Lessons – PAUSED (Should Not Appear)', desc: 'This listing is paused and should not appear in search results or the landing page.', instrument: 'Piano', location: 'Wan Chai', format: 'in_person', rate: 400, unit: 'hour', status: 'paused' });

// a deleted listing for testing spec 3
insertListing({ userId: michaelId, type: 'offering_lessons', title: 'Guitar Lessons – DELETED (Should Not Appear)', desc: 'This listing is deleted and should not appear anywhere in the public interface.', instrument: 'Guitar', location: 'Mong Kok', format: 'both', rate: 300, unit: 'hour', status: 'deleted' });

// MESSAGE THREADS

function insertThread(p1: number, p2: number, listingId: number | null): number {
  const result = db.prepare('INSERT INTO message_threads (participant_1_id, participant_2_id, listing_id, last_message_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(p1, p2, listingId);
  return result.lastInsertRowid as number;
}

function insertMessage(threadId: number, senderId: number, content: string) {
  // insert the message then bump the thread timestamp so the inbox sorts right
  db.prepare('INSERT INTO messages (thread_id, sender_id, content) VALUES (?, ?, ?)').run(threadId, senderId, content);
  db.prepare('UPDATE message_threads SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(threadId);
}

// thread 1: demo student messages demo teacher (used in the screencast)
const demoThread = insertThread(demoStudentId, demoTeacherId, listing9);
insertMessage(demoThread, demoStudentId, "Hi! I saw your piano listing and I'm interested in taking lessons. I'm a complete beginner but very motivated. Are you available on weekends?");
insertMessage(demoThread, demoTeacherId, "Hello! Great to hear from you. I do have Saturday morning slots available. Would 10am work? My studio is in Central near the MTR.");
insertMessage(demoThread, demoStudentId, "That would be perfect! How long is each lesson and what should I bring for the first session?");
insertMessage(demoThread, demoTeacherId, "Lessons are 60 minutes. For your first session just bring yourself — I'll assess your level and we'll discuss your goals together. Looking forward to meeting you!");

// thread 2
const thread2 = insertThread(tommyId, sarahId, listing1);
insertMessage(thread2, tommyId, "Hi Sarah! I'd love to start piano lessons. I'm a complete beginner. Are you available on weekends?");
insertMessage(thread2, sarahId, "Hello Tommy! I have Saturday morning slots. Would 10am work for you? My studio is in Wan Chai near the MTR.");
insertMessage(thread2, tommyId, "That would be perfect! How long is each lesson?");

// thread 3
const thread3 = insertThread(graceId, emilyId, listing5);
insertMessage(thread3, graceId, "Hi Emily! I'm an intermediate violin student (Grade 4) looking to work towards Grade 6. Could we arrange a trial lesson?");
insertMessage(thread3, emilyId, "Hi Grace! Of course. I usually do a 30-minute assessment first. When are you free this week?");
insertMessage(thread3, graceId, "I'm free Saturday afternoon or Sunday morning. Either would work great!");

// REVIEWS

const reviewData = [
  { reviewer: tommyId, reviewee: sarahId, listing: listing1, rating: 5, comment: "Sarah is an amazing teacher! Patient, encouraging, and incredibly skilled. I've improved so much in just 3 months. Highly recommend!" },
  { reviewer: graceId, reviewee: sarahId, listing: listing1, rating: 5, comment: "Exceptional teaching. Sarah tailors every lesson to your specific needs and explains concepts very clearly." },
  { reviewer: kevinId, reviewee: michaelId, listing: listing3, rating: 4, comment: "Michael is a great guitar teacher who makes learning fun. Good variety of songs and styles covered." },
  { reviewer: tommyId, reviewee: michaelId, listing: listing3, rating: 5, comment: "Fantastic teacher! I went from knowing nothing to playing full songs in 2 months. Very knowledgeable about all genres." },
  { reviewer: graceId, reviewee: emilyId, listing: listing5, rating: 5, comment: "Emily is exceptional. Her HKPO background really shows in her teaching quality. She pushes you to improve while being encouraging." },
  { reviewer: kevinId, reviewee: jasonId, listing: listing6, rating: 5, comment: "Jason is the best drum teacher! Super energetic and passionate. My lessons are always fun and productive." },
  { reviewer: tommyId, reviewee: jasonId, listing: listing6, rating: 4, comment: "Great drum lessons. Jason covers rudiments to full songs. Very patient with beginners." },
  { reviewer: graceId, reviewee: lindaId, listing: listing7, rating: 5, comment: "Linda has completely transformed my singing. She identified bad habits I'd had for years. Incredible knowledge of vocal technique." },
];

for (const review of reviewData) {
  db.prepare('INSERT OR IGNORE INTO reviews (reviewer_id, reviewee_id, listing_id, rating, comment) VALUES (?, ?, ?, ?, ?)').run(review.reviewer, review.reviewee, review.listing, review.rating, review.comment);
}

// MARKETPLACE INSTRUMENTS

const marketplaceItems = [
  { seller: sarahId, title: 'Yamaha U1 Upright Piano – Excellent Condition', desc: 'Well-maintained Yamaha U1 upright piano, regularly tuned. Perfect for students or home practice. Comes with piano bench. Moving overseas — must sell.', category: 'piano', brand: 'Yamaha', condition: 'good', price: 15000, neg: 1, loc: 'Wan Chai' },
  { seller: michaelId, title: 'Taylor 214ce Acoustic-Electric Guitar', desc: 'Taylor 214ce with electronics, barely used. Comes with original Taylor hard case and strap. A fantastic instrument at a great price.', category: 'guitar', brand: 'Taylor', condition: 'like_new', price: 4800, neg: 1, loc: 'Mong Kok' },
  { seller: emilyId, title: 'German 3/4 Violin Outfit – Beginner/Intermediate', desc: 'Quality German-made 3/4 violin, ideal for students aged 8–12. Includes bow, rosin, case, and shoulder rest. Previous student upgraded to full size.', category: 'violin', brand: null, condition: 'good', price: 1200, neg: 0, loc: 'Central' },
  { seller: jasonId, title: 'Pearl Export Series Drum Kit – Full Setup', desc: 'Pearl Export 5-piece kit with Zildjian cymbal pack, hi-hat stand, snare stand, and bass drum pedal. Great starter or gigging kit.', category: 'drums', brand: 'Pearl', condition: 'good', price: 4200, neg: 1, loc: 'Tsim Sha Tsui' },
  { seller: lindaId, title: 'Shure SM58 Vocal Microphone + Stand', desc: 'Industry-standard Shure SM58 in excellent working condition. Includes boom stand, XLR cable, and carrying case.', category: 'other', brand: 'Shure', condition: 'good', price: 600, neg: 0, loc: 'Causeway Bay' },
  { seller: demoTeacherId, title: 'Casio CDP-S100 Digital Piano – Like New', desc: 'Compact 88-key digital piano with weighted keys. Great for beginners. Comes with sustain pedal and stand. Upgrading to acoustic — reluctant sale.', category: 'piano', brand: 'Casio', condition: 'like_new', price: 1800, neg: 1, loc: 'Central' },
  { seller: graceId, title: 'Stentor Student II Violin – Full Size 4/4', desc: 'Full-size student violin in great condition. Includes bow, case, and rosin. Switching to cello so no longer needed.', category: 'violin', brand: 'Stentor', condition: 'good', price: 800, neg: 1, loc: 'Central' },
];

for (const item of marketplaceItems) {
  db.prepare(`
    INSERT OR IGNORE INTO instruments_for_sale
      (seller_id, title, description, category, brand, condition, price, is_negotiable, location_district, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(item.seller, item.title, item.desc, item.category, item.brand ?? null, item.condition, item.price, item.neg, item.loc);
}

// silence "declared but never used" warnings for listings the demo doesn't reference
// (they're still inserted into the database, just not used after this point)
void listing2; void listing4; void listing7; void listing8; void listing10; void listing11; void listing12; void listing13;

db.close();

console.log('Seeding done.');
console.log('');
console.log('Demo accounts (password: password123):');
console.log('  teacher@test.com');
console.log('  student@test.com');
console.log('');
console.log('Other accounts (also password: password123):');
console.log('  sarah@example.com, michael@example.com, emily@example.com');
console.log('  jason@example.com, linda@example.com');
console.log('  tommy@example.com, grace@example.com, kevin@example.com');
console.log('');
console.log('Listings: 13 active, 1 paused, 1 deleted');
console.log('Threads: 3');
console.log('Reviews: 8');
