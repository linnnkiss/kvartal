import api from '../axios';
import type { Listing } from '@kvartal/shared';

export async function fetchFavorites(): Promise<Listing[]> {
  const { data } = await api.get('/api/favorites');
  return data;
}

export async function fetchFavoriteIds(): Promise<string[]> {
  const { data } = await api.get('/api/favorites/ids');
  return data;
}

export async function addFavorite(listingId: string): Promise<void> {
  await api.post(`/api/favorites/${listingId}`);
}

export async function removeFavorite(listingId: string): Promise<void> {
  await api.delete(`/api/favorites/${listingId}`);
}
