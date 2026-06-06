-- name: get_user_by_email
SELECT * FROM users WHERE email = ?;

-- name: get_user_by_username
SELECT id, name, username, avatar_url, location_district, bio,
       instruments, experience_level, role, created_at
FROM users
WHERE username = ?;

-- name: get_user_by_id
SELECT * FROM users WHERE id = ?;

-- name: create_user
INSERT INTO users (name, email, password_hash, username, role)
VALUES (?, ?, ?, ?, ?);

-- name: is_email_taken
SELECT id FROM users WHERE email = ?;

-- name: is_username_taken
SELECT id FROM users WHERE username = ?;

-- name: update_user_password
UPDATE users
SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;


-- TEACHER PROFILES

-- name: get_teacher_profile
SELECT * FROM teacher_profiles WHERE user_id = ?;

-- name: teacher_profile_exists
SELECT id FROM teacher_profiles WHERE user_id = ?;

-- name: update_teacher_profile
UPDATE teacher_profiles
SET hourly_rate = ?, lesson_format = ?, student_levels = ?,
    qualifications = ?, lesson_description = ?, teaching_languages = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;

-- name: create_teacher_profile
INSERT INTO teacher_profiles
    (user_id, hourly_rate, lesson_format, student_levels,
     qualifications, lesson_description, teaching_languages)
VALUES (?, ?, ?, ?, ?, ?, ?);


-- LISTINGS

-- name: get_listing_by_id
SELECT l.*,
       u.name AS user_name,
       u.username AS user_username,
       u.avatar_url AS user_avatar_url,
       u.bio AS user_bio,
       u.location_district AS user_location
FROM listings l
JOIN users u ON l.user_id = u.id
WHERE l.id = ?;

-- name: get_listings_by_user
SELECT * FROM listings
WHERE user_id = ? AND status != 'deleted'
ORDER BY created_at DESC;

-- name: get_active_listings_by_user
SELECT * FROM listings
WHERE user_id = ? AND status = 'active'
ORDER BY created_at DESC;

-- name: create_listing
INSERT INTO listings
    (user_id, type, title, description, instrument, location_district,
     lesson_format, rate, rate_unit, student_level, teaching_languages)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: get_listing_owner
SELECT user_id FROM listings WHERE id = ?;

-- name: soft_delete_listing
UPDATE listings
SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
WHERE id = ?;


-- MESSAGES

-- name: find_thread_between
SELECT id FROM message_threads
WHERE (participant_1_id = ? AND participant_2_id = ?)
   OR (participant_1_id = ? AND participant_2_id = ?);

-- name: create_thread
INSERT INTO message_threads
    (participant_1_id, participant_2_id, listing_id, last_message_at)
VALUES (?, ?, ?, CURRENT_TIMESTAMP);

-- name: get_threads_for_user
SELECT t.*,
       u1.name AS p1_name, u1.username AS p1_username, u1.avatar_url AS p1_avatar,
       u2.name AS p2_name, u2.username AS p2_username, u2.avatar_url AS p2_avatar,
       (SELECT content FROM messages
        WHERE thread_id = t.id
        ORDER BY created_at DESC LIMIT 1) AS last_message,
       (SELECT COUNT(*) FROM messages
        WHERE thread_id = t.id AND sender_id != ? AND read_at IS NULL) AS unread_count
FROM message_threads t
JOIN users u1 ON t.participant_1_id = u1.id
JOIN users u2 ON t.participant_2_id = u2.id
WHERE t.participant_1_id = ? OR t.participant_2_id = ?
ORDER BY COALESCE(t.last_message_at, t.created_at) DESC;

-- name: mark_messages_read
UPDATE messages
SET read_at = CURRENT_TIMESTAMP
WHERE thread_id = ? AND sender_id != ? AND read_at IS NULL;

-- name: get_messages_in_thread
SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.thread_id = ?
ORDER BY m.created_at ASC;

-- name: get_thread_for_user
SELECT t.*,
       u1.name AS p1_name, u1.username AS p1_username, u1.avatar_url AS p1_avatar,
       u2.name AS p2_name, u2.username AS p2_username, u2.avatar_url AS p2_avatar,
       l.title AS listing_title, l.id AS listing_id_link
FROM message_threads t
JOIN users u1 ON t.participant_1_id = u1.id
JOIN users u2 ON t.participant_2_id = u2.id
LEFT JOIN listings l ON t.listing_id = l.id
WHERE t.id = ? AND (t.participant_1_id = ? OR t.participant_2_id = ?);

-- name: insert_message
INSERT INTO messages (thread_id, sender_id, content)
VALUES (?, ?, ?);

-- name: bump_thread_timestamp
UPDATE message_threads
SET last_message_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: get_unread_message_count
SELECT COUNT(*) AS unreadMessageCount
FROM messages m
JOIN message_threads t ON m.thread_id = t.id
WHERE (t.participant_1_id = ? OR t.participant_2_id = ?)
  AND m.sender_id != ? AND m.read_at IS NULL;


-- REVIEWS

-- name: get_reviews_for_user
SELECT r.*,
       u.name AS reviewer_name,
       u.avatar_url AS reviewer_avatar,
       u.username AS reviewer_username
FROM reviews r
JOIN users u ON r.reviewer_id = u.id
WHERE r.reviewee_id = ?
ORDER BY r.created_at DESC;

-- name: get_average_rating_for_user
SELECT AVG(rating) AS averageRating
FROM reviews
WHERE reviewee_id = ?;

-- name: create_review
INSERT INTO reviews (reviewer_id, reviewee_id, listing_id, rating, comment)
VALUES (?, ?, ?, ?, ?);


-- MARKETPLACE

-- name: get_marketplace_item_by_id
SELECT i.*,
       u.name AS seller_name,
       u.username AS seller_username,
       u.avatar_url AS seller_avatar,
       u.bio AS seller_bio
FROM instruments_for_sale i
JOIN users u ON i.seller_id = u.id
WHERE i.id = ? AND i.status != 'deleted';

-- name: create_marketplace_item
INSERT INTO instruments_for_sale
    (seller_id, title, description, category, brand, condition, price,
     is_negotiable, location_district)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);


-- DYNAMIC QUERIES

-- name: get_active_listings_base
SELECT l.*,
       u.name AS user_name,
       u.username AS user_username,
       u.avatar_url AS user_avatar_url,
       ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.reviewee_id = l.user_id), 1) AS avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = l.user_id) AS review_count
FROM listings l
JOIN users u ON l.user_id = u.id
WHERE l.status = 'active' /* + extra filters AND'd in by code */
ORDER BY l.created_at DESC /* or rate ASC, rate DESC, avg_rating DESC */
LIMIT ? OFFSET ?;

-- name: count_active_listings_base
SELECT COUNT(*) AS count FROM listings l
WHERE l.status = 'active' /* + same extra filters */;

-- name: update_user_profile_template
UPDATE users SET /* fields = ? */, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: update_listing_template
UPDATE listings SET /* fields = ? */, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: get_marketplace_items_base
SELECT i.*,
       u.name AS seller_name,
       u.username AS seller_username,
       u.avatar_url AS seller_avatar
FROM instruments_for_sale i
JOIN users u ON i.seller_id = u.id
WHERE i.status = 'active' /* + extra filters */
ORDER BY i.created_at DESC /* or price ASC, price DESC */
LIMIT ? OFFSET ?;

-- name: count_marketplace_items_base
SELECT COUNT(*) AS count FROM instruments_for_sale i
WHERE i.status = 'active' /* + same extra filters */;
