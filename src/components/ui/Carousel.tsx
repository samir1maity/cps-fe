// src/components/ui/Carousel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string; // Optional background color (default: gradient)
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoSlideInterval?: number; // in milliseconds, default 5000
  transitionDuration?: number; // in milliseconds, default 500
}

const Carousel: React.FC<CarouselProps> = ({ 
  slides, 
  autoSlideInterval = 5000,
  transitionDuration = 500
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [isTransitioning, transitionDuration]);

  const nextSlide = useCallback(() => {
    const newIndex = (currentIndex + 1) % slides.length;
    goToSlide(newIndex);
  }, [currentIndex, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    const newIndex = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(newIndex);
  }, [currentIndex, slides.length, goToSlide]);

  // Auto-slide functionality
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide, autoSlideInterval, slides.length]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const handlePrevClick = () => {
    setIsPaused(true);
    prevSlide();
  };

  const handleNextClick = () => {
    setIsPaused(true);
    nextSlide();
  };

  const handleDotClick = (index: number) => {
    setIsPaused(true);
    goToSlide(index);
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="w-screen relative left-[50%] right-[50%] -mx-[50vw]">
      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
      >
        {/* Slides */}
        <div className="relative h-[25vh] min-h-[250px]">
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;
            const bgClass = slide.bgColor || 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100';
            
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${bgClass} ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Slide Content - Centered Vertically and Horizontally */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-800">
                    {slide.title && (
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2 leading-tight">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2 opacity-90">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.description && (
                      <p className="text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 opacity-85 max-w-lg mx-auto leading-relaxed">
                        {slide.description}
                      </p>
                    )}
                    {slide.ctaText && slide.ctaLink && (
                      <Link
                        href={slide.ctaLink}
                        className="inline-block bg-[var(--brand-600)] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-[10px] sm:text-xs md:text-sm hover:bg-[var(--brand-700)] transition-all shadow-md hover:shadow-lg hover:scale-105 mt-1 sm:mt-1.5"
                      >
                        {slide.ctaText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons - Inside Carousel, Overlaying Content */}
        <button
          onClick={handlePrevClick}
          disabled={isTransitioning}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onClick={handleNextClick}
          disabled={isTransitioning}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Dots Indicator - Inside Carousel at Bottom */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
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
      </div>
    </div>
  );
};

export default Carousel;

