import { Link } from 'react-router-dom';
import { Heart, MapPin, Layers, Maximize2, Building } from 'lucide-react';
import { useState } from 'react';
import type { Listing } from '@kvartal/shared';
import { formatPrice, formatArea, roomsLabel, DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from '../../lib/format';
import { addFavorite, removeFavorite } from '../../lib/api/favorites';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';

interface ListingCardProps {
  listing: Listing;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, newState: boolean) => void;
}

export function ListingCard({ listing, isFavorite = false, onFavoriteToggle }: ListingCardProps) {
  const { user } = useAuth();
  const [fav, setFav] = useState(isFavorite);
  const [favLoading, setFavLoading] = useState(false);

  const image = listing.images?.[0] || PLACEHOLDER;
  const dealBadge = listing.dealType === 'rent' ? 'Аренда' : 'Продажа';
  const dealColor = listing.dealType === 'rent' ? 'bg-cyan-100 text-cyan-700' : 'bg-primary-100 text-primary-700';

  async function handleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Войдите, чтобы добавить в избранное');
      return;
    }
    setFavLoading(true);
    try {
      if (fav) {
        await removeFavorite(listing.id);
        setFav(false);
        onFavoriteToggle?.(listing.id, false);
      } else {
        await addFavorite(listing.id);
        setFav(true);
        onFavoriteToggle?.(listing.id, true);
        toast.success('Добавлено в избранное');
      }
    } catch {
      toast.error('Ошибка при обновлении избранного');
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Link to={`/listings/${listing.id}`} className="card block hover:shadow-md transition-shadow group">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={listing.title}
          className="w-full h-52 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          loading="lazy"
        />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${dealColor}`}>
          {dealBadge}
        </span>
        <button
          onClick={handleFav}
          disabled={favLoading}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            fav ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-400'
          }`}
          aria-label={fav ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{formatPrice(listing.price)}</div>
        {listing.dealType === 'rent' && <span className="text-xs text-gray-400">/мес.</span>}

        <p className="text-sm text-gray-700 font-medium mt-1 line-clamp-2">{listing.title}</p>

        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{listing.address}</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {listing.rooms != null && (
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <Building className="w-3 h-3" />
              {roomsLabel(listing.rooms)}
            </span>
          )}
          {listing.area && (
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <Maximize2 className="w-3 h-3" />
              {formatArea(listing.area)}
            </span>
          )}
          {listing.floor && listing.totalFloors && (
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <Layers className="w-3 h-3" />
              {listing.floor}/{listing.totalFloors} эт.
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
          </span>
        </div>
      </div>
    </Link>
  );
}
