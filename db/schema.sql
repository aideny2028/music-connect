CREATE TABLE IF NOT EXISTS users (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    email             TEXT    NOT NULL UNIQUE,
    password_hash     TEXT    NOT NULL,
    name              TEXT    NOT NULL,
    username          TEXT    NOT NULL UNIQUE,
    avatar_url        TEXT,
    location_district TEXT,
    bio               TEXT,
    instruments       TEXT    NOT NULL DEFAULT '',
    experience_level  TEXT,
    role              TEXT    NOT NULL DEFAULT 'student',
    language_pref     TEXT    NOT NULL DEFAULT 'en',
    is_admin          INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS teacher_profiles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL UNIQUE REFERENCES users(id),
    hourly_rate         REAL,
    lesson_format       TEXT    NOT NULL DEFAULT 'in_person',
    student_levels      TEXT    NOT NULL DEFAULT '',
    qualifications      TEXT,
    lesson_description  TEXT,
    teaching_languages  TEXT    NOT NULL DEFAULT '',
    created_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS listings (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    type                TEXT    NOT NULL,
    title               TEXT    NOT NULL,
    description         TEXT    NOT NULL,
    instrument          TEXT    NOT NULL,
    location_district   TEXT,
    lesson_format       TEXT    NOT NULL,
    rate                REAL,
    rate_unit           TEXT,
    student_level       TEXT,
    teaching_languages  TEXT,
    status              TEXT    NOT NULL DEFAULT 'active',
    view_count          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS message_threads (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_1_id  INTEGER NOT NULL REFERENCES users(id),
    participant_2_id  INTEGER NOT NULL REFERENCES users(id),
    listing_id        INTEGER REFERENCES listings(id),
    last_message_at   TEXT,
    created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id   INTEGER NOT NULL REFERENCES message_threads(id),
    sender_id   INTEGER NOT NULL REFERENCES users(id),
    content     TEXT    NOT NULL,
    read_at     TEXT,
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS reviews (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id   INTEGER NOT NULL REFERENCES users(id),
    reviewee_id   INTEGER NOT NULL REFERENCES users(id),
    listing_id    INTEGER REFERENCES listings(id),
    rating        INTEGER NOT NULL,
    comment       TEXT,
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, reviewee_id)
);


CREATE TABLE IF NOT EXISTS instruments_for_sale (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id           INTEGER NOT NULL REFERENCES users(id),
    title               TEXT    NOT NULL,
    description         TEXT    NOT NULL,
    category            TEXT    NOT NULL,
    brand               TEXT,
    condition           TEXT    NOT NULL,
    price               REAL    NOT NULL,
    is_negotiable       INTEGER NOT NULL DEFAULT 0,
    location_district   TEXT,
    images              TEXT,
    status              TEXT    NOT NULL DEFAULT 'active',
    view_count          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS saved_listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    listing_id  INTEGER NOT NULL REFERENCES listings(id),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, listing_id)
);


CREATE INDEX IF NOT EXISTS idx_listings_user_id      ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status       ON listings(status);
CREATE INDEX IF NOT EXISTS idx_threads_participants  ON message_threads(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread       ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread       ON messages(thread_id, sender_id, read_at);
CREATE INDEX IF NOT EXISTS idx_instruments_seller    ON instruments_for_sale(seller_id);
CREATE INDEX IF NOT EXISTS idx_instruments_status    ON instruments_for_sale(status);
