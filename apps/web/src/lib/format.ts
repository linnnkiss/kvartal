export function formatPrice(price: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatArea(area: number): string {
  return `${area} м²`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export const DEAL_TYPE_LABELS: Record<string, string> = {
  sale: 'Продажа',
  rent: 'Аренда',
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Квартира',
  studio: 'Студия',
  newbuilding: 'Новостройка',
  room: 'Комната',
  house: 'Дом',
};

export function roomsLabel(rooms: number | null | undefined): string {
  if (!rooms) return 'Студия';
  if (rooms === 1) return '1-комн.';
  if (rooms >= 5) return `${rooms}-комн.`;
  return `${rooms}-комн.`;
}
