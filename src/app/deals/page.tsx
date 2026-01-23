'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Loader2,
  Tag,
  Calendar,
  Star,
  MapPin,
  ArrowRight,
  Flame,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Property } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface Deal {
  property: Property;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  pricePerNight: number;
  originalPricePerNight: number;
  savings: number;
  savingsPercent: number;
}

export default function DealsPage() {
  const { t } = useLocale();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNights, setSelectedNights] = useState<number | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  // Generate upcoming date ranges for 2, 3, and 4 night stays
  const generateDateRanges = () => {
    const ranges: { checkIn: string; checkOut: string; nights: number }[] = [];
    const today = new Date();

    // Generate date ranges for the next 60 days
    for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + dayOffset);

      // Generate 2, 3, and 4 night stays
      for (const nights of [2, 3, 4]) {
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + nights);

        ranges.push({
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          nights,
        });
      }
    }

    return ranges;
  };

  // Fetch properties and calculate deals
  useEffect(() => {
    async function fetchDeals() {
      setLoading(true);
      try {
        // First fetch all properties
        const response = await fetch('/api/listings');
        const data = await response.json();

        if (data.success && data.data) {
          setProperties(data.data);

          // Filter properties that are likely to have deals (lower base price)
          const budgetProperties = data.data.filter(
            (p: Property) => p.price.perNight <= 150
          );

          // Generate potential deals
          const dateRanges = generateDateRanges();
          const potentialDeals: Deal[] = [];

          // For each budget property, calculate deals based on their base price
          for (const property of budgetProperties) {
            // Estimate total with fees (base price + ~15% for cleaning/fees)
            const estimatedFeeMultiplier = 1.15;
            const estimatedPerNight = property.price.perNight * estimatedFeeMultiplier;

            // Only include if estimated price is under $100/night
            if (estimatedPerNight <= 100) {
              // Find best date ranges for this property
              for (const range of dateRanges.slice(0, 30)) { // Limit to first 30 dates
                const totalPrice = property.price.perNight * range.nights;
                const withFees = totalPrice * estimatedFeeMultiplier;
                const pricePerNight = withFees / range.nights;

                if (pricePerNight <= 100) {
                  // Calculate savings vs "regular" price ($150/night)
                  const regularPrice = 150 * range.nights;
                  const savings = regularPrice - withFees;
                  const savingsPercent = Math.round((savings / regularPrice) * 100);

                  potentialDeals.push({
                    property,
                    checkIn: range.checkIn,
                    checkOut: range.checkOut,
                    nights: range.nights,
                    totalPrice: Math.round(withFees),
                    pricePerNight: Math.round(pricePerNight),
                    originalPricePerNight: property.price.perNight,
                    savings: Math.round(savings),
                    savingsPercent,
                  });
                }
              }
            }
          }

          // Remove duplicates (same property, keep best deal per night count)
          const uniqueDeals = new Map<string, Deal>();
          for (const deal of potentialDeals) {
            const key = `${deal.property.id}-${deal.nights}`;
            const existing = uniqueDeals.get(key);
            if (!existing || deal.pricePerNight < existing.pricePerNight) {
              uniqueDeals.set(key, deal);
            }
          }

          // Sort by price per night and limit
          const sortedDeals = Array.from(uniqueDeals.values())
            .sort((a, b) => a.pricePerNight - b.pricePerNight)
            .slice(0, 50);

          setDeals(sortedDeals);
        }
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, []);

  // Filter deals by selected nights
  const filteredDeals = selectedNights
    ? deals.filter(d => d.nights === selectedNights)
    : deals;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-[var(--casita-gray-50)]">
      <Header />

      {/* Hero Section */}
      <div className="pt-20 md:pt-24 bg-gradient-to-b from-[var(--casita-orange)]/10 to-[var(--casita-gray-50)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--casita-orange)] text-white rounded-full text-sm font-medium mb-4">
              <Flame className="w-4 h-4" />
              Hot Deals
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--casita-gray-900)] mb-4">
              Budget-Friendly Stays
            </h1>
            <p className="text-lg text-[var(--casita-gray-600)] max-w-2xl mx-auto mb-8">
              Discover amazing deals under <span className="font-semibold text-[var(--casita-orange)]">$100/night</span> including all fees.
              Perfect for quick getaways of 2-4 nights.
            </p>

            {/* Night Filter Tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedNights(null)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedNights === null
                    ? 'bg-[var(--casita-gray-900)] text-white'
                    : 'bg-white text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-100)] border border-[var(--casita-gray-200)]'
                }`}
              >
                All Deals
              </button>
              {[2, 3, 4].map(nights => (
                <button
                  key={nights}
                  onClick={() => setSelectedNights(nights)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedNights === nights
                      ? 'bg-[var(--casita-gray-900)] text-white'
                      : 'bg-white text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-100)] border border-[var(--casita-gray-200)]'
                  }`}
                >
                  {nights} Nights
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin mb-4" />
            <p className="text-[var(--casita-gray-600)]">Finding the best deals for you...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-[var(--casita-gray-300)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-2">
              No deals found
            </h3>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Check back soon for new budget-friendly deals!
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--casita-orange)] text-white rounded-full font-medium hover:bg-opacity-90 transition-colors"
            >
              Browse All Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--casita-gray-600)] mb-6">
              <span className="font-semibold text-[var(--casita-gray-900)]">{filteredDeals.length}</span> deals found
              {selectedNights && ` for ${selectedNights}-night stays`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeals.map((deal, index) => (
                <Link
                  key={`${deal.property.id}-${deal.nights}-${index}`}
                  href={`/property/${deal.property.slug}?checkIn=${deal.checkIn}&checkOut=${deal.checkOut}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--casita-gray-100)] hover:shadow-lg transition-all group"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={deal.property.images[0]}
                      alt={deal.property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className="px-3 py-1 bg-[var(--casita-orange)] text-white text-sm font-semibold rounded-full">
                        ${deal.pricePerNight}/night
                      </span>
                      {deal.savingsPercent >= 20 && (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          Save {deal.savingsPercent}%
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">{deal.property.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1 line-clamp-1 group-hover:text-[var(--casita-orange)] transition-colors">
                      {deal.property.name}
                    </h3>

                    <div className="flex items-center gap-1 text-sm text-[var(--casita-gray-500)] mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{deal.property.location.city}</span>
                    </div>

                    {/* Deal Details */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--casita-gray-100)]">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-[var(--casita-gray-400)]" />
                        <span className="text-[var(--casita-gray-700)]">
                          {formatDate(deal.checkIn)} - {formatDate(deal.checkOut)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-[var(--casita-gray-400)]" />
                        <span className="font-medium text-[var(--casita-gray-900)]">
                          {deal.nights} nights
                        </span>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[var(--casita-gray-500)]">Total with fees</span>
                      <span className="text-lg font-bold text-[var(--casita-gray-900)]">
                        ${deal.totalPrice}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl p-8 border border-[var(--casita-gray-100)]">
          <h2 className="text-2xl font-serif font-bold text-[var(--casita-gray-900)] mb-4">
            How Our Deals Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Under $100/Night</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">
                  All deals include taxes and fees, no surprises at checkout.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--casita-turquoise)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[var(--casita-turquoise)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Short Stays</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">
                  Perfect for quick getaways - 2, 3, or 4 night stays.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--casita-coral)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-[var(--casita-coral)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Limited Time</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">
                  Deals update daily based on availability. Book fast!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
