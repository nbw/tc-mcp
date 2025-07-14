export interface SearchParams {
  query?: string;
  location?: {
    lat: number;
    lng: number;
  };
  cuisines?: string[];
  date_min?: string;
  date_max?: string;
  num_people?: number;
  time?: string;
  budget_max?: number;
  budget_min?: number;
  sort_by?: 'distance' | 'price';
  sort_order?: 'asc' | 'desc';
  geo_distance?: string;
  locale?: 'en' | 'jp';
}

export interface RestaurantResult {
  id: string;
  name: string;
  slug: string;
  cuisine: string[];
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  price_range: {
    min?: number;
    max?: number;
    currency: string;
  };
  availability_summary: string;
  rating?: number;
  image_url?: string;
  reservation_url: string;
}

export interface AvailabilityParams {
  shop_id: string;
  start_at: string;
  num_people: number;
  locale?: 'en' | 'jp';
}

export interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
  party_size: number;
}

export interface Cuisine {
  id: string;
  name: string;
  locale: string;
}

export interface ApiResponse<T> {
  data?: T;
  errors?: string[];
}

export interface ShopSearchResponse {
  shops: any[];
  total_count: number;
  page: number;
  per_page: number;
}

export interface AutocompleteResponse {
  cuisines?: any[];
  shops?: any[];
} 