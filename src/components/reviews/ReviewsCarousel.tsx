'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, Shield, Award, ExternalLink } from 'lucide-react';

interface Review {
  _id: string;
  reviewerName: string;
  reviewDate: string;
  publicReview: string;
  rating: number;
  propertyName?: string;
}

// Airbnb profile URL - links directly to reviews section
const AIRBNB_REVIEWS_URL = 'https://www.airbnb.com/users/show/7936498#reviews';

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setReviews(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (reviews.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, [reviews.length, isPaused]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Truncate review text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className="py-12 bg-gradient-to-b from-white to-[var(--casita-gray-50)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--casita-gray-200)] rounded w-48 mx-auto mb-8" />
            <div className="h-32 bg-[var(--casita-gray-100)] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Show confidence section even if no reviews from our API
  const currentReview = reviews.length > 0 ? reviews[currentIndex] : null;

  return (
    <div
      className="py-12 bg-gradient-to-b from-white to-[var(--casita-gray-50)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Book in Confidence Header */}
        <div className="text-center mb-8">
          {/* Superhost Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--casita-orange)]/10 rounded-full mb-4">
            <Award className="w-5 h-5 text-[var(--casita-orange)]" />
            <span className="text-sm font-semibold text-[var(--casita-orange)]">Verified Superhost</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[var(--casita-gray-900)] flex items-center justify-center gap-2">
            <Shield className="w-7 h-7 text-[var(--casita-orange)]" />
            Book in Confidence
          </h2>
          <p className="text-[var(--casita-gray-600)] mt-3 max-w-xl mx-auto">
            Casita is a verified multi-year Superhost with over <span className="font-bold text-[var(--casita-gray-900)]">60,000+</span> real reviews — the only account in the USA with this distinction.
          </p>

          {/* Airbnb Reviews Button */}
          <a
            href={AIRBNB_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-[#FF5A5F] text-white rounded-full font-semibold hover:bg-[#E04E53] transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457-.263-1.267-.057-2.32.614-3.134.395-.479.894-.806 1.449-.954.275-.073.547-.11.814-.11.932 0 1.728.457 2.175 1.17.263.423.39.91.39 1.402 0 .736-.234 1.56-.713 2.448-.36.665-.871 1.433-1.52 2.282-.424.555-.874 1.113-1.343 1.67l-.453.566-.453-.566c-.469-.557-.919-1.115-1.343-1.67-.649-.849-1.16-1.617-1.52-2.282-.479-.888-.713-1.712-.713-2.448 0-.492.127-.979.39-1.402.447-.713 1.243-1.17 2.175-1.17.267 0 .539.037.814.11.555.148 1.054.475 1.449.954.671.814.877 1.867.614 3.134-.265 1.273-1.06 2.76-2.413 4.457z"/>
            </svg>
            See All 60,000+ Reviews on Airbnb
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Carousel - only show if we have reviews */}
        {currentReview && (
          <div className="relative mt-8">
            {/* Navigation Arrows */}
            {reviews.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-[var(--casita-gray-200)] flex items-center justify-center hover:bg-[var(--casita-gray-50)] transition-colors"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-5 h-5 text-[var(--casita-gray-700)]" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-[var(--casita-gray-200)] flex items-center justify-center hover:bg-[var(--casita-gray-50)] transition-colors"
                  aria-label="Next review"
                >
                  <ChevronRight className="w-5 h-5 text-[var(--casita-gray-700)]" />
                </button>
              </>
            )}

            {/* Review Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-[var(--casita-gray-100)] p-6 md:p-8 transition-all duration-500">
              {/* Quote Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[var(--casita-orange)]/10 rounded-full flex items-center justify-center">
                  <Quote className="w-6 h-6 text-[var(--casita-orange)]" />
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < currentReview.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-[var(--casita-gray-300)]'
                    }`}
                  />
                ))}
              </div>

              {/* Review Text */}
              <blockquote className="text-center text-lg md:text-xl text-[var(--casita-gray-700)] leading-relaxed mb-6 min-h-[80px]">
                &ldquo;{truncateText(currentReview.publicReview, 300)}&rdquo;
              </blockquote>

              {/* Reviewer Info */}
              <div className="text-center">
                <p className="font-semibold text-[var(--casita-gray-900)]">
                  {currentReview.reviewerName}
                </p>
                <p className="text-sm text-[var(--casita-gray-500)]">
                  {currentReview.propertyName && (
                    <span>{currentReview.propertyName} &middot; </span>
                  )}
                  {formatDate(currentReview.reviewDate)}
                </p>
              </div>
            </div>

            {/* Dots Indicator */}
            {reviews.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {reviews.slice(0, Math.min(reviews.length, 10)).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-6 bg-[var(--casita-orange)]'
                        : 'bg-[var(--casita-gray-300)] hover:bg-[var(--casita-gray-400)]'
                    }`}
                    aria-label={`Go to review ${index + 1}`}
                  />
                ))}
                {reviews.length > 10 && (
                  <span className="text-xs text-[var(--casita-gray-500)] ml-2">
                    +{reviews.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
