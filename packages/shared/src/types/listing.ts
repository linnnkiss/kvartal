export type DealType = 'rent' | 'sale';

export type PropertyType = 'apartment' | 'studio' | 'newbuilding' | 'room' | 'house';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  address: string;
  district?: string | null;
  rooms?: number | null;
  area?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  propertyType: PropertyType;
  dealType: DealType;
  images: string[];
  sourceName?: string | null;
  sourceUrl?: string | null;
  isHidden: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string | null;
  author?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string;
  } | null;
}

export interface ListingsResponse {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListingFilters {
  city?: string;
  district?: string;
  dealType?: DealType;
  propertyType?: PropertyType;
  rooms?: number;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
  page?: number;
  limit?: number;
  search?: string;
}
