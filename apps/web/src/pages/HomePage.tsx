import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Building2, Home, Key } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { fetchListings } from '../lib/api/listings';
import type { Listing } from '@kvartal/shared';
import { ListingCard } from '../components/listings/ListingCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const POPULAR_SEARCHES = [
  { label: '1-комн. аренда Москва', query: '?dealType=rent&rooms=1&city=Москва' },
  { label: '2-комн. продажа Москва', query: '?dealType=sale&rooms=2&city=Москва' },
  { label: 'Новостройки СПб', query: '?propertyType=newbuilding&city=Санкт-Петербург' },
  { label: 'Студии от 25 000 ₽', query: '?dealType=rent&propertyType=studio' },
  { label: 'Трёшки в Казани', query: '?rooms=3&city=Казань' },
];

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург'];

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [dealType, setDealType] = useState<'sale' | 'rent'>('sale');
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchListings({ limit: 8, sortBy: 'date_desc' })
      .then((res) => setLatestListings(res.items))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city) params.set('city', city);
    params.set('dealType', dealType);
    navigate(`/listings?${params}`);
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 text-white px-3 py-10 sm:px-4 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 opacity-90" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Квартал</h1>
          </div>
          <p className="text-primary-100 text-base sm:text-lg mb-7 sm:mb-10">Найдите идеальную квартиру для покупки или аренды</p>

          <div className="bg-white rounded-2xl p-2 shadow-2xl">
            <div className="flex rounded-xl overflow-hidden border border-gray-100 mb-2">
              {(['sale', 'rent'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDealType(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    dealType === t ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 'sale' ? 'Купить' : 'Снять'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 sm:min-w-[140px]"
              >
                <option value="">Все города</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:ring-2 focus-within:ring-primary-400 bg-white">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Район, улица, ключевые слова..."
                  className="flex-1 py-3 text-sm outline-none text-gray-800 placeholder-gray-400"
                />
              </div>

              <button type="submit" className="btn-primary px-6 py-3 rounded-xl text-sm whitespace-nowrap">
                Найти
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <button
            onClick={() => navigate('/listings?dealType=sale')}
            className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-left"
          >
            <div className="bg-primary-100 rounded-xl p-3">
              <Home className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Продажа</div>
              <div className="text-sm text-gray-500">Купить квартиру</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/listings?dealType=rent')}
            className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all text-left"
          >
            <div className="bg-cyan-100 rounded-xl p-3">
              <Key className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Аренда</div>
              <div className="text-sm text-gray-500">Снять жильё</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/listings?propertyType=newbuilding')}
            className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left"
          >
            <div className="bg-emerald-100 rounded-xl p-3">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Новостройки</div>
              <div className="text-sm text-gray-500">Квартиры в новых ЖК</div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 mr-1">Популярные:</span>
          {POPULAR_SEARCHES.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(`/listings${s.query}`)}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 rounded-full transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-12 sm:pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Свежие объявления</h2>
          <button onClick={() => navigate('/listings')} className="text-sm text-primary-600 hover:underline">
            Все объявления →
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {latestListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </div>
  );
}
