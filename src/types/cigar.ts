export interface Cigar {
  id: string;
  brand: string;
  line: string;
  vitola: string;
  wrapper: string | null;
  strength_profile: string | null;
}

export interface BandImage {
  id: string;
  image_url: string;
  is_primary: boolean | null;
}

export interface SuggestedCigar {
  brand: string | null;
  line: string | null;
  vitola: string | null;
  wrapper: string | null;
  origin: string | null;
}
