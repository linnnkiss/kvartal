import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Trash2, Play, RefreshCw, Users, Home, TrendingUp } from 'lucide-react';
import type { Listing } from '@kvartal/shared';
import { fetchAdminListings, fetchStats, updateListing, deleteListing } from '../lib/api/listings';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui/Loader';
import { formatPrice, formatDate, DEAL_TYPE_LABELS } from '../lib/format';
import api from '../lib/axios';
import toast from 'react-hot-toast';

interface Stats { total: number; rent: number; sale: number; hidden: number; users: number }

export function AdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parserRunning, setParserRunning] = useState(false);
  const [parserSource, setParserSource] = useState<'demo' | 'csv' | 'avito'>('demo');
  const [parserLimit, setParserLimit] = useState(20);
  const [parserCity, setParserCity] = useState('nizhniy_novgorod');
  const [parserDealType, setParserDealType] = useState<'sale' | 'rent'>('sale');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, authLoading, navigate]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [ls, st] = await Promise.all([fetchAdminListings(), fetchStats()]);
      setListings(ls);
      setStats(st);
    } catch {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin]);

  async function toggleVisibility(listing: Listing) {
    try {
      const updated = await updateListing(listing.id, { isHidden: !listing.isHidden } as any);
      setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, isHidden: updated.isHidden } : l)));
      toast.success(updated.isHidden ? 'Скрыто' : 'Опубликовано');
    } catch {
      toast.error('Ошибка');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить объявление? Это действие необратимо.')) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Удалено');
    } catch {
      toast.error('Ошибка удаления');
    }
  }

  async function runParser() {
    setParserRunning(true);
    try {
      const payload: Record<string, unknown> = { source: parserSource, limit: parserLimit };
      if (parserSource === 'avito') {
        payload.city = parserCity;
        payload.dealType = parserDealType;
      }
      const { data } = await api.post('/api/parser/run', payload);
      toast.success(`Парсер завершён: сохранено ${data.saved}, пропущено ${data.skipped}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка парсера');
    } finally {
      setParserRunning(false);
    }
  }

  const filtered = listings.filter((l) =>
    !search ||
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.city.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || isLoading) return <Loader size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-amber-500" />
        Панель администратора
      </h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Всего', value: stats.total, icon: Home, color: 'primary' },
            { label: 'Продажа', value: stats.sale, icon: TrendingUp, color: 'emerald' },
            { label: 'Аренда', value: stats.rent, icon: Home, color: 'cyan' },
            { label: 'Скрытых', value: stats.hidden, icon: EyeOff, color: 'red' },
            { label: 'Пользователей', value: stats.users, icon: Users, color: 'violet' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm`}>
              <div className={`text-${color}-500 mb-1`}><Icon className="w-4 h-4" /></div>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary-600" />
          Запуск парсера
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Источник</label>
            <select
              value={parserSource}
              onChange={(e) => setParserSource(e.target.value as any)}
              className="input-base text-sm w-40"
            >
              <option value="demo">Demo генератор</option>
              <option value="csv">CSV файл</option>
              <option value="avito">Авито</option>
            </select>
          </div>

          {parserSource === 'avito' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Город (slug)</label>
                <select
                  value={parserCity}
                  onChange={(e) => setParserCity(e.target.value)}
                  className="input-base text-sm w-52"
                >
                  <option value="nizhniy_novgorod">Нижний Новгород</option>
                  <option value="moskva">Москва</option>
                  <option value="sankt-peterburg">Санкт-Петербург</option>
                  <option value="kazan">Казань</option>
                  <option value="novosibirsk">Новосибирск</option>
                  <option value="ekaterinburg">Екатеринбург</option>
                  <option value="samara">Самара</option>
                  <option value="ufa">Уфа</option>
                  <option value="krasnoyarsk">Красноярск</option>
                  <option value="perm">Пермь</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Тип сделки</label>
                <select
                  value={parserDealType}
                  onChange={(e) => setParserDealType(e.target.value as any)}
                  className="input-base text-sm w-32"
                >
                  <option value="sale">Продажа</option>
                  <option value="rent">Аренда</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Количество</label>
            <input
              type="number"
              min={1}
              max={parserSource === 'avito' ? 50 : 100}
              value={parserLimit}
              onChange={(e) => setParserLimit(Number(e.target.value))}
              className="input-base text-sm w-24"
            />
          </div>
          <button
            onClick={runParser}
            disabled={parserRunning}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {parserRunning ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Парсинг...</>
            ) : (
              <><Play className="w-4 h-4" /> Запустить</>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {parserSource === 'avito'
            ? 'Авито: реальные объявления с сайта. Требует ~30–60 сек. Может быть заблокирован при частых запросах.'
            : parserSource === 'csv'
            ? 'CSV импортирует из файла src/data/listings.csv'
            : 'Demo генератор создаёт тестовые объявления.'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800">Все объявления ({listings.length})</h2>
          <div className="flex items-center gap-2">
            <input
              className="input-base text-sm w-48"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={loadData} className="text-gray-400 hover:text-primary-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Объявление</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Тип</th>
                <th className="text-left px-4 py-3 font-medium">Цена</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Источник</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Дата</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((listing) => (
                <tr key={listing.id} className={`hover:bg-gray-50 ${listing.isHidden ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <a
                      href={`/listings/${listing.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-800 hover:text-primary-600 line-clamp-1 max-w-xs"
                    >
                      {listing.title}
                    </a>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{listing.city}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      listing.dealType === 'rent' ? 'bg-cyan-100 text-cyan-700' : 'bg-primary-100 text-primary-700'
                    }`}>
                      {DEAL_TYPE_LABELS[listing.dealType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatPrice(listing.price)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 max-w-[120px] truncate">
                    {listing.sourceName || '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(listing.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      listing.isHidden ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {listing.isHidden ? 'Скрыто' : 'Активно'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleVisibility(listing)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title={listing.isHidden ? 'Опубликовать' : 'Скрыть'}
                      >
                        {listing.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Объявления не найдены</div>
          )}
        </div>
      </div>
    </div>
  );
}
