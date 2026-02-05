export interface SmokeLogWithDetails {
  id: string;
  smoked_at: string;
  notes: string;
  photo_url: string | null;
  overall_score: number;
  construction: number;
  flavor: number;
  strength: number;
  burn: number;
  created_at: string;
  user_id: string;
  cigar: {
    id: string;
    brand: string;
    line: string;
    vitola: string;
  };
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}
