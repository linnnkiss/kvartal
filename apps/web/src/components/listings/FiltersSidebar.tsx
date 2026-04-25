import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ListingFilters, DealType, PropertyType } from '@kvartal/shared';

interface FiltersSidebarProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
  total?: number;
}

const ROOMS_OPTIONS = [
  { value: '', label: 'Любое' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4+' },
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Сначала новые' },
  { value: 'date_asc', label: 'Сначала старые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
];

const PROPERTY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Любой' },
  { value: 'apartment', label: 'Квартира' },
  { value: 'studio', label: 'Студия' },
  { value: 'newbuilding', label: 'Новостройка' },
  { value: 'room', label: 'Комната' },
  { value: 'house', label: 'Дом' },
];

export function FiltersSidebar({ filters, onChange, total }: FiltersSidebarProps) {
  const [local, setLocal] = useState<ListingFilters>(filters);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setLocal(filters); }, [filters]);

  function set(key: keyof ListingFilters, value: any) {
    setLocal((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  function apply() {
    onChange({ ...local, page: 1 });
    setMobileOpen(false);
  }

  function reset() {
    const cleared: ListingFilters = { sortBy: 'date_desc', page: 1, limit: 20 };
    setLocal(cleared);
    onChange(cleared);
  }

  const hasFilters = !!(local.city || local.dealType || local.propertyType || local.rooms !== undefined ||
    local.priceMin || local.priceMax || local.areaMin || local.areaMax);

  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
          {total !== undefined && <span className="text-xs font-normal text-gray-500">({total})</span>}
        </h3>
        {hasFilters && (
          <button onClick={reset} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Сбросить
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Тип сделки</label>
        <div className="flex gap-2">
          {(['', 'sale', 'rent'] as const).map((v) => (
            <button
              key={v}
              onClick={() => set('dealType', v as DealType)}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                (local.dealType || '') === v
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {v === '' ? 'Все' : v === 'sale' ? 'Продажа' : 'Аренда'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Город</label>
        <input
          className="input-base text-sm"
          placeholder="Москва"
          value={local.city || ''}
          onChange={(e) => set('city', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Тип жилья</label>
        <select
          className="input-base text-sm"
          value={local.propertyType || ''}
          onChange={(e) => set('propertyType', e.target.value as PropertyType)}
        >
          {PROPERTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Комнат</label>
        <div className="flex gap-1.5 flex-wrap">
          {ROOMS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => set('rooms', o.value ? Number(o.value) : undefined)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                String(local.rooms ?? '') === o.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Цена, ₽</label>
        <div className="flex gap-2">
          <input
            className="input-base text-sm"
            placeholder="от"
            type="number"
            min={0}
            value={local.priceMin || ''}
            onChange={(e) => set('priceMin', e.target.value ? Number(e.target.value) : undefined)}
          />
          <input
            className="input-base text-sm"
            placeholder="до"
            type="number"
            min={0}
            value={local.priceMax || ''}
            onChange={(e) => set('priceMax', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Площадь, м²</label>
        <div className="flex gap-2">
          <input
            className="input-base text-sm"
            placeholder="от"
            type="number"
            min={0}
            value={local.areaMin || ''}
            onChange={(e) => set('areaMin', e.target.value ? Number(e.target.value) : undefined)}
          />
          <input
            className="input-base text-sm"
            placeholder="до"
            type="number"
            min={0}
            value={local.areaMax || ''}
            onChange={(e) => set('areaMax', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Сортировка</label>
        <select
          className="input-base text-sm"
          value={local.sortBy || 'date_desc'}
          onChange={(e) => set('sortBy', e.target.value as ListingFilters['sortBy'])}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <button onClick={apply} className="btn-primary w-full">
        Показать объявления
      </button>
    </div>
  );

  return (
    <>
      <button
        className="md:hidden flex items-center gap-2 btn-outline text-sm mb-4"
        onClick={() => setMobileOpen(true)}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Фильтры {hasFilters && <span className="bg-primary-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">!</span>}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto shadow-xl">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            {content}
          </div>
        </div>
      )}

      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm sticky top-24">
          {content}
        </div>
      </div>
    </>
  );
}
