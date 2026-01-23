'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Star, Home, Users, Award, Heart, MapPin, Phone, Mail, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-[var(--casita-gray-50)] to-white relative overflow-hidden">
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
              Florida's largest Superhost, pioneering the boutique hotel experience
              on Airbnb since 2018.
            </p>
          </div>
        </div>
      </section>

      {/* Founders */}
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
                  <Award className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Airbnb Superhost Advisory Panel Members</strong> — Selected among elite hosts worldwide to shape the future of hospitality</p>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Pioneers of the Airbnb Hotel Concept</strong> — Launched Miami Beach's first Airbnb hotel in 2018, revolutionizing how travelers experience boutique hospitality</p>
                </div>
                <div className="flex items-start gap-3">
                  <Home className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0 mt-1" />
                  <p className="m-0"><strong>Industry-Leading Hotel Transformation</strong> — First operators to successfully convert traditional hotels into Airbnb boutique experiences, consistently outperforming competitors by <strong className="text-[var(--casita-orange)]">over 33%</strong> in revenue generation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-6 text-center">
              Who We Are
            </h2>
            <div className="prose prose-lg mx-auto text-[var(--casita-gray-600)]">
              <p className="mb-6">
                What started as a vision to reimagine hospitality has grown into Florida's largest
                Airbnb Superhost operation. Based in the heart of Miami Beach, we pioneered the
                concept of bringing the personalized Airbnb experience to full-service hotels.
              </p>
              <p className="mb-6">
                With over 60,000 five-star reviews and $50 million+ in gross revenue generated for our
                property partners, we've proven that the boutique hotel experience and short-term
                rental flexibility can coexist—and thrive together.
              </p>
              <p>
                Our team provides 24/7 bilingual guest support, ensuring every guest feels at home
                from the moment they book until the day they check out. We handle everything—from
                listing optimization to maintenance coordination—so property owners can enjoy
                passive income without the hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[var(--casita-gray-50)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-[var(--casita-orange)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--casita-gray-900)]">60K+</div>
              <div className="text-[var(--casita-gray-600)]">5-Star Reviews</div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-[var(--casita-orange)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--casita-gray-900)]">99.4%</div>
              <div className="text-[var(--casita-gray-600)]">Occupancy</div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-[var(--casita-orange)]" />
              </div>
              <div className="text-3xl font-bold text-[var(--casita-gray-900)]">$50M+</div>
              <div className="text-[var(--casita-gray-600)]">Gross Revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-12 text-center">
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--casita-turquoise)]/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-[var(--casita-turquoise)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-3">Guest First</h3>
                <p className="text-[var(--casita-gray-600)]">
                  Every decision we make prioritizes the guest experience, from seamless check-ins
                  to responsive 24/7 support.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--casita-coral)]/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-[var(--casita-coral)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-3">Excellence</h3>
                <p className="text-[var(--casita-gray-600)]">
                  We maintain Superhost status through meticulous attention to detail and
                  consistently exceeding expectations.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[var(--casita-orange)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-3">Partnership</h3>
                <p className="text-[var(--casita-gray-600)]">
                  We treat every property owner as a partner, providing transparent reporting
                  and flexible month-to-month agreements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-[var(--casita-gray-50)]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-8">
              Get in Touch
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-[var(--casita-gray-600)]">
                <MapPin className="w-5 h-5 text-[var(--casita-orange)]" />
                <span>436 Ocean Dr, Miami Beach, FL 33139</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-[var(--casita-gray-600)]">
                <Phone className="w-5 h-5 text-[var(--casita-orange)]" />
                <a href="tel:+17866947577" className="hover:text-[var(--casita-orange)] transition-colors">
                  (786) 694-7577
                </a>
              </div>
              <div className="flex items-center justify-center gap-3 text-[var(--casita-gray-600)]">
                <Mail className="w-5 h-5 text-[var(--casita-orange)]" />
                <a href="mailto:hola@hellocasita.com" className="hover:text-[var(--casita-orange)] transition-colors">
                  hola@hellocasita.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 bg-gradient-to-br from-[var(--casita-orange)]/5 to-[var(--casita-turquoise)]/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[var(--casita-orange)]" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--casita-gray-900)]">
                Our Mission
              </h2>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-xl text-center text-[var(--casita-gray-700)] leading-relaxed mb-6">
                To redefine boutique hospitality by creating unforgettable stays that blend the warmth
                of home with the excellence of a luxury hotel—while maximizing returns for property owners
                and setting new standards for the short-term rental industry.
              </p>
              <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-[var(--casita-gray-200)]">
                <div className="text-center">
                  <h4 className="font-semibold text-[var(--casita-gray-900)] mb-2">For Guests</h4>
                  <p className="text-sm text-[var(--casita-gray-600)]">
                    Curated stays with hotel-quality service and the comfort of home
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-[var(--casita-gray-900)] mb-2">For Owners</h4>
                  <p className="text-sm text-[var(--casita-gray-600)]">
                    Hassle-free property management with industry-leading returns
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-[var(--casita-gray-900)] mb-2">For Communities</h4>
                  <p className="text-sm text-[var(--casita-gray-600)]">
                    Responsible hosting that respects neighborhoods and local regulations
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
