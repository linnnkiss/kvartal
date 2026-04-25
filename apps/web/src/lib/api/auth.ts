import api from '../axios';
import type { AuthResponse, User } from '@kvartal/shared';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function register(
  email: string,
  name: string,
  password: string,
  phone?: string
): Promise<AuthResponse> {
  const { data } = await api.post('/api/auth/register', { email, name, password, phone });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/api/me');
  return data;
}

export async function updateMe(payload: { name?: string; phone?: string }): Promise<User> {
  const { data } = await api.patch('/api/me', payload);
  return data;
}

export async function getMyListings() {
  const { data } = await api.get('/api/me/listings');
  return data;
}
