import api from '../axios';
import type { Listing, ListingsResponse, ListingFilters } from '@kvartal/shared';

export async function fetchListings(filters: ListingFilters = {}): Promise<ListingsResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );
  const { data } = await api.get('/api/listings', { params });
  return data;
}

export async function fetchListingById(id: string): Promise<Listing> {
  const { data } = await api.get(`/api/listings/${id}`);
  return data;
}

export async function createListing(payload: Partial<Listing>): Promise<Listing> {
  const { data } = await api.post('/api/listings', payload);
  return data;
}

export async function updateListing(id: string, payload: Partial<Listing>): Promise<Listing> {
  const { data } = await api.patch(`/api/listings/${id}`, payload);
  return data;
}

export async function deleteListing(id: string): Promise<void> {
  await api.delete(`/api/listings/${id}`);
}

export async function fetchAdminListings(): Promise<Listing[]> {
  const { data } = await api.get('/api/listings/admin/all');
  return data;
}

export async function fetchStats() {
  const { data } = await api.get('/api/listings/admin/stats');
  return data as { total: number; rent: number; sale: number; hidden: number; users: number };
}
