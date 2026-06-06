export interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  avatar_url: string | null;
  location_district: string | null;
  bio: string | null;
  instruments: string;
  experience_level: string | null;
  role: 'teacher' | 'student';
  language_pref: 'en' | 'zh-hk';
  is_admin: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile {
  id: number;
  user_id: number;
  hourly_rate: number | null;
  lesson_format: 'in_person' | 'online' | 'both';
  student_levels: string;
  qualifications: string | null;
  lesson_description: string | null;
  teaching_languages: string;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: number;
  user_id: number;
  type: 'offering_lessons' | 'looking_for_teacher';
  title: string;
  description: string;
  instrument: string;
  location_district: string | null;
  lesson_format: 'in_person' | 'online' | 'both';
  rate: number | null;
  rate_unit: 'hour' | '30min' | 'package' | null;
  student_level: string | null;
  teaching_languages: string | null;
  status: 'active' | 'paused' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface ListingWithUser extends Listing {
  user_name: string;
  user_username: string;
  user_avatar_url: string | null;
}

export interface MessageThread {
  id: number;
  participant_1_id: number;
  participant_2_id: number;
  listing_id: number | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  reviewer_id: number;
  reviewee_id: number;
  listing_id: number | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const DISTRICTS = [
  'Central', 'Wan Chai', 'Causeway Bay', 'Mong Kok',
  'Tsim Sha Tsui', 'Yau Ma Tei', 'Sham Shui Po', 'Kwun Tong',
  'Sha Tin', 'Tuen Mun', 'Tai Po', 'Online',
];

export const INSTRUMENTS = [
  'Piano', 'Guitar', 'Violin', 'Drums', 'Voice',
  'Cello', 'Flute', 'Saxophone', 'Ukulele', 'Bass Guitar', 'Erhu', 'Other',
];
