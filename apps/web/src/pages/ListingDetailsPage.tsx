import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Maximize2, Layers, Building, Heart, Phone, Calendar,
  ArrowLeft, ExternalLink, Home
} from 'lucide-react';
import type { Listing } from '@kvartal/shared';
import { fetchListingById } from '../lib/api/listings';
import { addFavorite, removeFavorite, fetchFavoriteIds } from '../lib/api/favorites';
import { ImageGallery } from '../components/listings/ImageGallery';
import { Loader } from '../components/ui/Loader';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate, formatArea, roomsLabel, DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from '../lib/format';
import toast from 'react-hot-toast';

export function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchListingById(id)
      .then(setListing)
      .catch(() => setError('Объявление не найдено или удалено'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchFavoriteIds().then((ids) => setIsFav(ids.includes(id))).catch(() => {});
    }
  }, [user, id]);

  async function toggleFav() {
    if (!user) { toast.error('Войдите, чтобы добавить в избранное'); return; }
    setFavLoading(true);
    try {
      if (isFav) {
        await removeFavorite(id!);
        setIsFav(false);
      } else {
        await addFavorite(id!);
        setIsFav(true);
        toast.success('Добавлено в избранное');
      }
    } catch {
      toast.error('Ошибка');
    } finally {
      setFavLoading(false);
    }
  }

  if (isLoading) return <div className="max-w-5xl mx-auto px-4 py-10"><Loader size="lg" /></div>;

  if (error || !listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">{error || 'Объявление не найдено'}</h2>
        <button onClick={() => navigate('/listings')} className="btn-primary mt-4">
          Назад к списку
        </button>
      </div>
    );
  }

  const dealLabel = DEAL_TYPE_LABELS[listing.dealType] || listing.dealType;
  const typeLabel = PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType;
  const fullAddress = [listing.city, listing.address].filter(Boolean).join(', ');
  const encodedAddress = encodeURIComponent(fullAddress);
  const embeddedMapUrl = `https://www.google.com/maps?q=${encodedAddress}&z=15&output=embed`;
  const yandexMapUrl = `https://yandex.ru/maps/?text=${encodedAddress}`;
  const doubleGisUrl = `https://2gis.ru/search/${encodedAddress}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ImageGallery images={listing.images} title={listing.title} />

          <div className="mt-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                listing.dealType === 'rent' ? 'bg-cyan-100 text-cyan-700' : 'bg-primary-100 text-primary-700'
              }`}>{dealLabel}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{typeLabel}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>

            <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{listing.address}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {listing.rooms != null && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Building className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold">{roomsLabel(listing.rooms)}</div>
                  <div className="text-xs text-gray-400">Комнат</div>
                </div>
              )}
              {listing.area && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Maximize2 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold">{formatArea(listing.area)}</div>
                  <div className="text-xs text-gray-400">Площадь</div>
                </div>
              )}
              {listing.floor && listing.totalFloors && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Layers className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold">{listing.floor}/{listing.totalFloors}</div>
                  <div className="text-xs text-gray-400">Этаж</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-sm font-semibold">{new Date(listing.publishedAt).toLocaleDateString('ru-RU')}</div>
                <div className="text-xs text-gray-400">Опубликовано</div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Описание</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {listing.sourceUrl && listing.sourceName !== 'seed' && listing.sourceName !== 'demo-generator' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href={listing.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Источник: {listing.sourceName || listing.sourceUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm sticky top-24">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPrice(listing.price)}
            </div>
            {listing.dealType === 'rent' && (
              <div className="text-sm text-gray-400 mb-4">в месяц</div>
            )}

            <div className="space-y-3 mb-5">
              <button
                onClick={toggleFav}
                disabled={favLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-colors ${
                  isFav
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : 'border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                {isFav ? 'В избранном' : 'В избранное'}
              </button>
            </div>

            {listing.author && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 mb-2">Продавец</div>
                <div className="font-semibold text-gray-800 mb-1">{listing.author.name}</div>
                {listing.author.phone && (
                  <a
                    href={`tel:${listing.author.phone}`}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {listing.author.phone}
                  </a>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm font-semibold text-gray-800 mb-2">Расположение</div>
              <div className="text-xs text-gray-500 mb-3">{fullAddress}</div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <iframe
                  title={`Карта: ${listing.title}`}
                  src={embeddedMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-56 w-full"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={yandexMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  Открыть в Яндекс
                </a>
                <a
                  href={doubleGisUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  Открыть в 2ГИС
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
