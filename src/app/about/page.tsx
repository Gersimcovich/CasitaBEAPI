'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Star, TrendingUp, Award, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-8 bg-gradient-to-br from-[var(--casita-gray-50)] to-white relative overflow-hidden">
        {/* Decorative images */}
        <img
          src="/palm.webp"
          alt=""
          className="absolute -left-8 md:left-4 bottom-0 w-24 md:w-36 h-auto opacity-20 pointer-events-none"
        />
        <img
          src="/wave.webp"
          alt=""
          className="absolute right-4 md:right-12 top-24 w-20 md:w-32 h-auto opacity-20 pointer-events-none"
        />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--casita-gray-900)] mb-6">
              About <span className="text-[var(--casita-orange)]">Casita</span>
            </h1>
            <p className="text-xl text-[var(--casita-gray-600)] leading-relaxed">
              Florida&apos;s largest Superhost and home to Miami Beach&apos;s first exclusive
              Airbnb hotel, launched in 2018. We replaced the traditional front desk with
              a welcoming bar and reimagined check-in entirely—every guest arrives to a
              seamless app-based experience with 24/7 digital concierge support. What began
              as a bold experiment in boutique hospitality helped reshape the industry,
              proving that intimate, design-forward spaces with the right amenities
              outperform traditional hotels and inspire a new generation of modern
              stays worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Industry Recognition - after About hero */}
      <section className="py-16 bg-[var(--casita-gray-50)]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-10 text-center">
              Industry Recognition
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Airbnb Superhost Panel */}
              <div className="bg-white rounded-2xl overflow-hidden border border-[var(--casita-gray-100)] shadow-sm">
                <img
                  src="/airbnb-panel.jpg"
                  alt="Georgia Whalen speaking at the Airbnb Superhost Panel in Miami"
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <div className="inline-flex items-center gap-1.5 bg-[var(--casita-orange)]/10 text-[var(--casita-orange)] text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    <Award className="w-3.5 h-3.5" />
                    Airbnb Superhost Panel
                  </div>
                  <p className="text-[var(--casita-gray-600)] text-sm leading-relaxed">
                    Selected from thousands of hosts across Florida as one of four panelists for
                    Airbnb's inaugural Superhost Panel in Miami — sharing insights on hospitality
                    innovation and the future of short-term rentals.
                  </p>
                </div>
              </div>

              {/* Guesty Interview */}
              <div className="bg-white rounded-2xl overflow-hidden border border-[var(--casita-gray-100)] shadow-sm">
                <img
                  src="/guesty-interview.jpg"
                  alt="Georgia Whalen and German Daniel Simcovich interviewed by Guesty"
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    <Star className="w-3.5 h-3.5" />
                    Guesty Top Operators
                  </div>
                  <p className="text-[var(--casita-gray-600)] text-sm leading-relaxed">
                    Featured by Guesty, one of the world's largest property management platforms,
                    in an exclusive interview recognizing Casita as top operators in Miami Beach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Founders */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-6 text-center">
              Our Founders
            </h2>
            <div className="prose prose-lg mx-auto text-[var(--casita-gray-600)] text-center">
              <p className="mb-6 text-xl">
                Founded by <strong className="text-[var(--casita-gray-900)]">German Daniel Simcovich</strong> & <strong className="text-[var(--casita-gray-900)]">Georgia Whalen</strong>
              </p>
              <div className="bg-[var(--casita-orange)]/5 rounded-2xl p-8 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Miami Beach&apos;s First Exclusive Airbnb Hotel</strong> — In 2018, we transformed a historic Art Deco boutique hotel in Miami Beach into the first property built entirely around Airbnb—no front desk, just a welcoming bar, app-based check-in, and 24/7 digital concierge. It changed everything. Local operators and international brands soon followed, adopting the model Casita pioneered.</p>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Reinventing the Hotel Experience</strong> — We took a conventional hotel and transformed it with next-generation hospitality software, smart technology hardware, and a warm, design-driven interior that feels like home—outperforming traditional operators by <strong className="text-[var(--casita-orange)]">over 40%</strong> in revenue</p>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Airbnb Superhost Advisory Panel</strong> — Selected among elite hosts worldwide to shape the future of hospitality alongside Airbnb leadership</p>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Our Mission</strong> — Curating a global collection of boutique hotels rooted in the culture and character of each destination — because a room is never the destination, it&apos;s the gateway to experiencing a place like a true local</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Transformation */}
      <section className="py-16 bg-[var(--casita-gray-50)]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-10 text-center">
              The Transformation
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Before */}
              <div className="bg-white rounded-2xl overflow-hidden border border-[var(--casita-gray-100)] shadow-sm">
                <img
                  src="/hotel-before.jpg"
                  alt="Historic Art Deco hotel before Casita"
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <div className="inline-flex items-center gap-1.5 bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    Before Casita
                  </div>
                  <p className="text-[var(--casita-gray-600)] text-sm leading-relaxed">
                    A classic Art Deco boutique hotel in Miami Beach — traditional operations,
                    conventional front desk, and standard hospitality management.
                  </p>
                </div>
              </div>

              {/* After */}
              <div className="bg-white rounded-2xl overflow-hidden border border-[var(--casita-gray-100)] shadow-sm">
                <img
                  src="/hotel-after.jpg"
                  alt="The hotel after Casita transformation"
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <div className="inline-flex items-center gap-1.5 bg-[var(--casita-orange)]/10 text-[var(--casita-orange)] text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    <TrendingUp className="w-3.5 h-3.5" />
                    After Casita — +40% Revenue
                  </div>
                  <p className="text-[var(--casita-gray-600)] text-sm leading-relaxed">
                    Reimagined with next-generation hospitality software, smart technology hardware,
                    and a warm, design-driven interior — outperforming traditional operators.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
