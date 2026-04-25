import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Listing } from '@kvartal/shared';
import { fetchFavorites } from '../lib/api/favorites';
import { ListingCard } from '../components/listings/ListingCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Loader } from '../components/ui/Loader';
import { useAuth } from '../contexts/AuthContext';

export function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFavorites()
        .then(setListings)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  function handleRemove(id: string) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (authLoading || isLoading) return <div className="max-w-7xl mx-auto px-4 py-10"><Loader size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        Избранное
        {listings.length > 0 && (
          <span className="text-base font-normal text-gray-400">({listings.length})</span>
        )}
      </h1>

      {listings.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Список избранного пуст"
          description="Добавляйте понравившиеся объявления, нажимая на значок сердечка"
          action={{ label: 'Смотреть объявления', onClick: () => navigate('/listings') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              isFavorite={true}
              onFavoriteToggle={(id, state) => { if (!state) handleRemove(id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
