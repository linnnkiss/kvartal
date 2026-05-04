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
interface ParserRun {
  id: string;
  source: string;
  city: string | null;
  dealType: 'sale' | 'rent' | null;
  requestedLimit: number;
  total: number;
  saved: number;
  skipped: number;
  status: 'running' | 'success' | 'empty' | 'skipped' | 'failed';
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
}

const PARSER_STATUS_LABELS: Record<ParserRun['status'], string> = {
  running: 'В работе',
  success: 'Успешно',
  empty: 'Нет данных',
  skipped: 'Пропущено',
  failed: 'Ошибка',
};

const PARSER_STATUS_CLASSES: Record<ParserRun['status'], string> = {
  running: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  empty: 'bg-amber-100 text-amber-700',
  skipped: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-700',
};

type AdminSortKey = 'createdAt' | 'price' | 'title' | 'status';
type SortDirection = 'asc' | 'desc';

export function AdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [parserRuns, setParserRuns] = useState<ParserRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parserRunning, setParserRunning] = useState(false);
  const [parserSource, setParserSource] = useState<'demo' | 'csv' | 'avito'>('demo');
  const [parserLimit, setParserLimit] = useState(20);
  const [parserCity, setParserCity] = useState('nizhniy_novgorod');
  const [parserDealType, setParserDealType] = useState<'sale' | 'rent'>('sale');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionRunning, setBulkActionRunning] = useState(false);
  const [sortKey, setSortKey] = useState<AdminSortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, authLoading, navigate]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [ls, st, runsResponse] = await Promise.all([
        fetchAdminListings(),
        fetchStats(),
        api.get<ParserRun[]>('/api/parser/runs'),
      ]);
      setListings(ls);
      setStats(st);
      setParserRuns(runsResponse.data);
      setSelectedIds((prev) => prev.filter((id) => ls.some((listing) => listing.id === id)));
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
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      toast.success('Удалено');
    } catch {
      toast.error('Ошибка удаления');
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => (
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    ));
  }

  function toggleFilteredSelection() {
    const filteredIds = filtered.map((listing) => listing.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

    setSelectedIds((prev) => {
      if (allFilteredSelected) return prev.filter((id) => !filteredIds.includes(id));
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  }

  function changeSort(nextKey: AdminSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === 'createdAt' ? 'desc' : 'asc');
  }

  function sortLabel(key: AdminSortKey) {
    if (sortKey !== key) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  async function runBulkVisibility(isHidden: boolean) {
    if (selectedIds.length === 0) return;
    setBulkActionRunning(true);
    try {
      await Promise.all(selectedIds.map((id) => updateListing(id, { isHidden } as any)));
      setListings((prev) => prev.map((listing) => (
        selectedIds.includes(listing.id) ? { ...listing, isHidden } : listing
      )));
      toast.success(isHidden ? 'Выбранные объявления скрыты' : 'Выбранные объявления опубликованы');
      setSelectedIds([]);
      await loadData();
    } catch {
      toast.error('Ошибка массового обновления');
    } finally {
      setBulkActionRunning(false);
    }
  }

  async function runBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить выбранные объявления (${selectedIds.length})? Это действие необратимо.`)) return;
    setBulkActionRunning(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteListing(id)));
      setListings((prev) => prev.filter((listing) => !selectedIds.includes(listing.id)));
      toast.success('Выбранные объявления удалены');
      setSelectedIds([]);
      await loadData();
    } catch {
      toast.error('Ошибка массового удаления');
    } finally {
      setBulkActionRunning(false);
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
      if (data.total === 0 && data.message) {
        toast.error(data.message);
      } else {
        toast.success(`Парсер завершён: сохранено ${data.saved}, пропущено ${data.skipped}`);
      }
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка парсера');
    } finally {
      setParserRunning(false);
    }
  }

  const sourceOptions = Array.from(new Set(listings.map((listing) => listing.sourceName || 'manual'))).sort();

  const filtered = listings.filter((l) => {
    const matchesSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || (l.sourceName || 'manual') === sourceFilter;
    const matchesDeal = dealFilter === 'all' || l.dealType === dealFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'hidden' ? l.isHidden : !l.isHidden);

    return matchesSearch && matchesSource && matchesDeal && matchesStatus;
  }).sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortKey === 'price') return (a.price - b.price) * direction;
    if (sortKey === 'title') return a.title.localeCompare(b.title, 'ru') * direction;
    if (sortKey === 'status') return (Number(a.isHidden) - Number(b.isHidden)) * direction;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
  });
  const filteredIds = filtered.map((listing) => listing.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800">История запусков парсера</h2>
          <button onClick={loadData} className="text-gray-400 hover:text-primary-600" title="Обновить">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Дата</th>
                <th className="text-left px-4 py-3 font-medium">Источник</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Параметры</th>
                <th className="text-left px-4 py-3 font-medium">Результат</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Сообщение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parserRuns.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Intl.DateTimeFormat('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(run.startedAt))}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{run.source}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                    {[run.city, run.dealType ? DEAL_TYPE_LABELS[run.dealType] : null, `лимит ${run.requestedLimit}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {run.total} / {run.saved} / {run.skipped}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PARSER_STATUS_CLASSES[run.status]}`}>
                      {PARSER_STATUS_LABELS[run.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 max-w-sm truncate">
                    {run.message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {parserRuns.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Запусков пока нет</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800">Все объявления ({filtered.length} из {listings.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input-base text-sm w-48"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="input-base text-sm w-40"
              title="Источник"
            >
              <option value="all">Все источники</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>{source === 'manual' ? 'Вручную' : source}</option>
              ))}
            </select>
            <select
              value={dealFilter}
              onChange={(e) => setDealFilter(e.target.value as typeof dealFilter)}
              className="input-base text-sm w-36"
              title="Тип сделки"
            >
              <option value="all">Все типы</option>
              <option value="sale">Продажа</option>
              <option value="rent">Аренда</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-base text-sm w-36"
              title="Статус"
            >
              <option value="all">Все статусы</option>
              <option value="visible">Активные</option>
              <option value="hidden">Скрытые</option>
            </select>
            <button onClick={loadData} className="text-gray-400 hover:text-primary-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100 bg-primary-50 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-primary-700">
              Выбрано: {selectedIds.length}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => runBulkVisibility(true)}
                disabled={bulkActionRunning}
                className="px-3 py-2 rounded-lg bg-white border border-primary-100 text-xs font-medium text-gray-700 hover:text-primary-700 hover:border-primary-200 disabled:opacity-50"
              >
                Скрыть
              </button>
              <button
                onClick={() => runBulkVisibility(false)}
                disabled={bulkActionRunning}
                className="px-3 py-2 rounded-lg bg-white border border-primary-100 text-xs font-medium text-gray-700 hover:text-primary-700 hover:border-primary-200 disabled:opacity-50"
              >
                Опубликовать
              </button>
              <button
                onClick={runBulkDelete}
                disabled={bulkActionRunning}
                className="px-3 py-2 rounded-lg bg-white border border-red-100 text-xs font-medium text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                Удалить
              </button>
              <button
                onClick={() => setSelectedIds([])}
                disabled={bulkActionRunning}
                className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Сбросить
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleFilteredSelection}
                    disabled={filtered.length === 0}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                    aria-label="Выбрать все отфильтрованные объявления"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => changeSort('title')} className="hover:text-primary-600">
                    Объявление{sortLabel('title')}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Тип</th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => changeSort('price')} className="hover:text-primary-600">
                    Цена{sortLabel('price')}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Источник</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  <button onClick={() => changeSort('createdAt')} className="hover:text-primary-600">
                    Дата{sortLabel('createdAt')}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => changeSort('status')} className="hover:text-primary-600">
                    Статус{sortLabel('status')}
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((listing) => (
                <tr key={listing.id} className={`hover:bg-gray-50 ${listing.isHidden ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(listing.id)}
                      onChange={() => toggleSelection(listing.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label={`Выбрать объявление ${listing.title}`}
                    />
                  </td>
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
