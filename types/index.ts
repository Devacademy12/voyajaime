export type UserRole = "touriste" | "prestataire" | "admin";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  agency_name: string | null;
  description: string | null;
  city: string | null;
  is_validated: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Excursion {
  id: string;
  prestataire_id: string;
  title: string;
  city: string;
  region: string | null;
  description: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  categories: string[];
  languages: string[];
  inclusions: string[];
  photos: string[];
  rating: number;
  reviews_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Reservation {
  id: string;
  touriste_id: string;
  excursion_id: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  special_needs: string | null;
  booking_code: string;
  created_at: string;
}

export interface Avis {
  id: string;
  touriste_id: string;
  excursion_id: string;
  reservation_id: string;
  rating: number;
  comment: string;
  is_moderated: boolean;
  prestataire_response: string | null;
  created_at: string;
}

export interface Paiement {
  id: string;
  reservation_id: string;
  prestataire_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: "pending" | "paid" | "refunded";
  paid_at: string | null;
  created_at: string;
}
