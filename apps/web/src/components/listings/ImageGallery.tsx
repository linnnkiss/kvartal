import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const imgs = images.length > 0 ? images : [PLACEHOLDER];
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  function prev(e?: React.MouseEvent) {
    e?.stopPropagation();
    setCurrent((c) => (c - 1 + imgs.length) % imgs.length);
  }

  function next(e?: React.MouseEvent) {
    e?.stopPropagation();
    setCurrent((c) => (c + 1) % imgs.length);
  }

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-gray-100 cursor-pointer group" onClick={() => setLightbox(true)}>
        <img
          src={imgs[current]}
          alt={title || 'Фото квартиры'}
          className="w-full h-80 md:h-[460px] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
        </div>

        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}

        {imgs.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {current + 1}/{imgs.length}
          </div>
        )}
      </div>

      {imgs.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                i === current ? 'ring-2 ring-primary-500' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-16 h-12 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(false)}
          >
            <X className="w-7 h-7" />
          </button>
          <button onClick={prev} className="absolute left-4 text-white/80 hover:text-white">
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img
            src={imgs[current]}
            alt={title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          />
          <button onClick={next} className="absolute right-4 text-white/80 hover:text-white">
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">{current + 1} / {imgs.length}</div>
        </div>
      )}
    </div>
  );
}
