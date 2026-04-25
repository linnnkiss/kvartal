import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { Listing, ListingFilters, ListingsResponse } from '@kvartal/shared';
import { fetchListings } from '../lib/api/listings';
import { fetchFavoriteIds } from '../lib/api/favorites';
import { ListingGrid } from '../components/listings/ListingGrid';
import { FiltersSidebar } from '../components/listings/FiltersSidebar';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';

function paramsToFilters(params: URLSearchParams): ListingFilters {
  const filters: ListingFilters = {};
  const get = (k: string) => params.get(k) || undefined;
  if (get('city')) filters.city = get('city');
  if (get('district')) filters.district = get('district');
  if (get('dealType')) filters.dealType = get('dealType') as any;
  if (get('propertyType')) filters.propertyType = get('propertyType') as any;
  if (get('rooms')) filters.rooms = Number(get('rooms'));
  if (get('priceMin')) filters.priceMin = Number(get('priceMin'));
  if (get('priceMax')) filters.priceMax = Number(get('priceMax'));
  if (get('areaMin')) filters.areaMin = Number(get('areaMin'));
  if (get('areaMax')) filters.areaMax = Number(get('areaMax'));
  if (get('sortBy')) filters.sortBy = get('sortBy') as any;
  if (get('page')) filters.page = Number(get('page'));
  if (get('search')) filters.search = get('search');
  filters.limit = 20;
  return filters;
}

function filtersToParams(filters: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && k !== 'limit') params.set(k, String(v));
  });
  return params;
}

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [result, setResult] = useState<ListingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  const filters = paramsToFilters(searchParams);

  const load = useCallback(async (f: ListingFilters) => {
    setIsLoading(true);
    try {
      const data = await fetchListings(f);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [searchParams.toString()]);

  useEffect(() => {
    if (user) {
      fetchFavoriteIds().then(setFavoriteIds).catch(() => {});
    }
  }, [user]);

  function handleFiltersChange(newFilters: ListingFilters) {
    setSearchParams(filtersToParams(newFilters));
  }

  function handlePageChange(page: number) {
    handleFiltersChange({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    handleFiltersChange({ ...filters, search: localSearch || undefined, page: 1 });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:ring-2 focus-within:ring-primary-400 bg-white shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по объявлениям..."
            className="flex-1 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>
        <button type="submit" className="btn-primary px-5 rounded-xl text-sm">Найти</button>
      </form>

      <div className="flex gap-6">
        <FiltersSidebar
          filters={filters}
          onChange={handleFiltersChange}
          total={result?.total}
        />

        <div className="flex-1 min-w-0">
          {!isLoading && result && result.total > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Найдено объявлений: <span className="font-semibold text-gray-800">{result.total}</span>
            </p>
          )}

          {!isLoading && result?.items.length === 0 && (
            <EmptyState
              icon={Search}
              title="Объявления не найдены"
              description="Попробуйте изменить параметры поиска или сбросить фильтры"
              action={{ label: 'Сбросить фильтры', onClick: () => handleFiltersChange({ limit: 20, sortBy: 'date_desc' }) }}
            />
          )}

          <ListingGrid
            listings={result?.items || []}
            isLoading={isLoading}
            favoriteIds={favoriteIds}
            onFavoriteToggle={(id, state) => {
              setFavoriteIds((prev) => state ? [...prev, id] : prev.filter((x) => x !== id));
            }}
          />

          {result && result.totalPages > 1 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
