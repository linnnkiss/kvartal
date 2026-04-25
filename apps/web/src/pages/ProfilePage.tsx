import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Building, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMyListings, updateMe } from '../lib/api/auth';
import type { Listing } from '@kvartal/shared';
import { ListingCard } from '../components/listings/ListingCard';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/format';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, isLoading: authLoading, login: authLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone || '' });
      getMyListings()
        .then(setListings)
        .catch(() => {})
        .finally(() => setListingsLoading(false));
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMe({ name: form.name, phone: form.phone || undefined });
      authLogin(updated as any, localStorage.getItem('kvartal_token')!);
      toast.success('Профиль обновлён');
      setEditing(false);
    } catch {
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <Loader size="lg" />;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Личный кабинет</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-primary-100 rounded-full p-3">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-primary-600">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Имя</label>
                <input
                  className="input-base text-sm"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Телефон</label>
                <input
                  className="input-base text-sm"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+7..."
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Сохраняю...' : 'Сохранить'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-outline text-sm flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-semibold text-gray-800 text-lg">{user.name}</div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone className="w-3.5 h-3.5" /> {user.phone}
                </div>
              )}
              <div className="text-xs text-gray-400 pt-1">
                Аккаунт с {formatDate(user.createdAt)}
              </div>
              {user.role === 'admin' && (
                <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Администратор
                </span>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <Link to="/favorites" className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-primary-200 transition-colors">
            <div className="text-2xl font-bold text-primary-600 mb-1">❤️</div>
            <div className="font-medium text-gray-700">Избранное</div>
            <div className="text-xs text-gray-400 mt-0.5">Сохранённые квартиры</div>
          </Link>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600 mb-1">{listings.length}</div>
            <div className="font-medium text-gray-700">Мои объявления</div>
            <div className="text-xs text-gray-400 mt-0.5">Опубликовано</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="col-span-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-red-200 hover:text-red-500 transition-colors text-gray-500 text-sm font-medium text-center"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-gray-500" />
          Мои объявления
        </h2>

        {listingsLoading ? (
          <Loader />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Building}
            title="Нет объявлений"
            description="Вы пока не опубликовали ни одного объявления"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
