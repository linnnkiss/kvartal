import type { Listing } from '@kvartal/shared';
import { ListingCard } from './ListingCard';
import { SkeletonCard } from '../ui/SkeletonCard';

interface ListingGridProps {
  listings: Listing[];
  isLoading?: boolean;
  favoriteIds?: string[];
  onFavoriteToggle?: (id: string, newState: boolean) => void;
}

export function ListingGrid({ listings, isLoading, favoriteIds = [], onFavoriteToggle }: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favoriteIds.includes(listing.id)}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  );
}
