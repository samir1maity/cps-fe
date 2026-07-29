'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export interface CarouselSlide {
  id: string;
  ctaLink?: string;
  bgColor?: string;
  imageUrl?: string | null;
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoSlideInterval?: number;
  transitionDuration?: number;
}

const DEFAULT_BG = 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100';

const Carousel: React.FC<CarouselProps> = ({
  slides,
  autoSlideInterval = 5000,
  transitionDuration = 500,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), transitionDuration);
    },
    [isTransitioning, transitionDuration],
  );

  const nextSlide = useCallback(
    () => goToSlide((currentIndex + 1) % slides.length),
    [currentIndex, slides.length, goToSlide],
  );

  const prevSlide = useCallback(
    () => goToSlide((currentIndex - 1 + slides.length) % slides.length),
    [currentIndex, slides.length, goToSlide],
  );

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const id = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(id);
  }, [isPaused, nextSlide, autoSlideInterval, slides.length]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="w-screen relative left-[50%] right-[50%] -mx-[50vw]">
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Slides — strict 3:1 ratio, capped at 480px so it never gets too tall */}
        <div className="relative w-full" style={{ aspectRatio: '3 / 1', maxHeight: '480px', minHeight: '160px' }}>
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            const bgClass = slide.bgColor || DEFAULT_BG;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {slide.ctaLink ? (
                  <a href={slide.ctaLink} className="absolute inset-0 block z-20" aria-label="View slide" />
                ) : null}
                {slide.imageUrl ? (
                  <Image
                    src={slide.imageUrl}
                    alt="Carousel banner"
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                  />
                ) : (
                  <div className={`absolute inset-0 ${bgClass}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Prev / Next buttons */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => { setIsPaused(true); prevSlide(); }}
              disabled={isTransitioning}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={() => { setIsPaused(true); nextSlide(); }}
              disabled={isTransitioning}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { setIsPaused(true); goToSlide(index); }}
                disabled={isTransitioning}
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-6 sm:w-8 bg-[var(--brand-600)] shadow-lg'
                    : 'w-2 sm:w-2.5 bg-white/60 hover:bg-[var(--brand-400)]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Carousel;
