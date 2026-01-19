'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLocale } from '@/contexts/LocaleContext';
import {
  Star,
  TrendingUp,
  Shield,
  Headphones,
  Send,
  CheckCircle,
  Building2,
  Home,
  Loader2,
  Award,
  Eye,
  MessageSquare,
  DollarSign,
  BarChart3,
  Clock,
  Users,
  Zap,
} from 'lucide-react';

export default function PartnerPage() {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyType: '',
    location: '',
    units: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Superhost Focus */}
      <section className="relative pt-28 pb-20 bg-gradient-to-br from-[var(--casita-black)] via-[var(--casita-gray-900)] to-[var(--casita-gray-800)] overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--casita-orange)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-[var(--casita-orange)]/5 rounded-full blur-2xl" />
          {/* Palm tree */}
          <img
            src="/palm.webp"
            alt=""
            className="absolute -left-8 md:left-4 bottom-0 w-28 md:w-40 h-auto opacity-15"
          />
          {/* Wave */}
          <img
            src="/wave.webp"
            alt=""
            className="absolute right-4 md:right-12 bottom-10 w-20 md:w-32 h-auto opacity-20"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[var(--casita-orange)]/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Award className="w-5 h-5 text-[var(--casita-orange)]" />
              <span className="text-[var(--casita-orange)] font-semibold">Florida's Largest Superhost</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Is Your Property on the<br />
              <span className="text-[var(--casita-orange)]">First Page of Airbnb?</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              With Casita, it would be. Leverage our 60,000+ positive reviews and Superhost status to maximize your property's visibility and revenue.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-[var(--casita-orange)] mb-2">60K+</div>
              <div className="text-white/70 text-sm">5-Star Reviews</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-[var(--casita-orange)] mb-2">$50M+</div>
              <div className="text-white/70 text-sm">Gross Revenue</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-[var(--casita-orange)] mb-2">99.4%</div>
              <div className="text-white/70 text-sm">Occupancy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Superhost Advantage Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[var(--casita-orange)] mb-4">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold uppercase tracking-wider text-sm">The Superhost Advantage</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--casita-gray-900)] mb-6">
                Your Property Deserves First Page Visibility
              </h2>
              <p className="text-lg text-[var(--casita-gray-600)] mb-8">
                As a Preferred Airbnb Partner with Florida's largest Superhost account, Casita maintains direct contact with Airbnb corporate and was invited to speak at Airbnb's first Superhost Panel in Miami.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--casita-orange)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">1st Page Visibility</h3>
                    <p className="text-[var(--casita-gray-600)] text-sm">Our SEO, listing optimization, and reputation management keeps listings at the top of search results with 500K+ monthly impressions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--casita-orange)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Boost Sales by 30%</h3>
                    <p className="text-[var(--casita-gray-600)] text-sm">Using dynamic pricing, we achieve occupancy rates 33.6% higher than competitors, turning unsold rooms into revenue.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--casita-orange)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Priority Placement</h3>
                    <p className="text-[var(--casita-gray-600)] text-sm">Our Superhost status secures priority placement and features in Airbnb newsletters, driving more bookings to your property.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual stats card */}
            <div className="bg-gradient-to-br from-[var(--casita-gray-50)] to-white rounded-3xl p-8 border border-[var(--casita-gray-100)]">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-[#FF5A5F]/10 px-4 py-2 rounded-full mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF5A5F">
                    <path d="M12.001 18.275c-1.577 1.582-3.277 2.48-4.574 2.48-1.91 0-2.927-1.393-2.927-3.406 0-2.896 2.058-5.447 5.407-7.481-.148-.42-.265-.843-.265-1.298 0-1.236.672-2.265 1.732-2.265.838 0 1.393.557 1.393 1.393 0 .82-.573 1.54-1.73 2.29.556 1.16 1.408 2.616 2.246 3.777 1.015-1.455 1.73-3.043 1.73-4.37 0-1.02-.425-1.687-1.08-2.012.395-.377 1.066-.606 1.636-.606 1.05 0 1.877.869 1.877 2.133 0 1.87-1.18 3.95-2.686 5.782.656.787 1.345 1.508 2.017 2.116 1.263.574 2.246-.132 2.246-.132l.115.82s-1.05.984-2.722.574c-.92.837-1.895 1.54-2.818 1.98.787.787 1.73 1.295 2.588 1.295 1.23 0 2.083-.787 2.686-1.672l.672.41c-.836 1.32-2.147 2.197-3.555 2.197-1.247 0-2.475-.656-3.458-1.706-.885.377-1.788.59-2.686.59-.28 0-.558-.017-.836-.066.41.443.854.82 1.313 1.148l-.427.656c-.656-.46-1.263-.984-1.804-1.557l-.016-.017zm2.065-3.638c-.77-1.05-1.525-2.246-2.148-3.458-2.64 1.787-4.305 3.917-4.305 6.24 0 1.426.623 2.344 1.895 2.344.984 0 2.263-.672 3.703-2.066-.41-.64-.836-1.33-1.247-2.05l.82-.476c.345.59.705 1.165 1.066 1.722.738-.77 1.443-1.623 2.05-2.507l.82.476c-.558.935-1.197 1.838-1.886 2.69.935-.492 1.853-1.115 2.722-1.87-.837-.788-1.722-1.69-2.557-2.608l.656-.557c.476.525.968 1.033 1.46 1.524.754-.885 1.393-1.837 1.887-2.804-.82.033-1.722-.132-2.476-.525-.345.607-.722 1.214-1.115 1.79l-.656-.442c.377-.557.737-1.115 1.066-1.673-.788-.984-1.607-2.165-2.362-3.425-2.41 1.64-4.14 3.572-4.997 5.618l-.82-.345c.935-2.214 2.787-4.255 5.34-5.978-.59-1.21-1.132-2.443-1.558-3.54-.131.083-.262.148-.41.197.656 1.214 1.345 2.493 2.017 3.703 2.033-1.197 4.354-2.066 6.847-2.066l.083.902c-2.28.033-4.404.82-6.273 1.936.573 1.115 1.197 2.28 1.853 3.36 1.115.525 2.312.656 3.36.525.082-.197.148-.41.213-.623l.853.263c-.066.213-.148.443-.23.656 1.05-.197 1.935-.656 2.525-1.296l.59.672c-.885.934-2.213 1.508-3.638 1.64-.607 1.033-1.313 2.017-2.066 2.934.984.984 2.017 1.804 3.017 2.394l-.41.787c-1.082-.623-2.197-1.508-3.246-2.558-.984.754-2.017 1.393-3.033 1.886.394.574.803 1.115 1.197 1.607l-.656.525c-.295-.377-.59-.77-.885-1.18-.952.394-1.92.624-2.854.624-.295 0-.59-.017-.869-.05.328.377.672.72 1.016 1.033l-.525.59z"/>
                  </svg>
                  <span className="text-[#FF5A5F] font-medium text-sm">You're a Superhost!</span>
                </div>
                <div className="text-5xl font-bold text-[var(--casita-gray-900)] mb-2">60,777</div>
                <div className="text-[var(--casita-gray-500)]">reviews</div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-[var(--casita-gray-100)]">
                  <div className="text-sm text-[var(--casita-gray-500)] mb-2">1st Page Impressions</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--casita-gray-700)]">Monthly Avg</span>
                    <span className="text-[var(--casita-orange)] font-semibold">536,289 imp</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--casita-gray-100)]">
                  <div className="text-sm text-[var(--casita-gray-500)] mb-2">Transaction History</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--casita-gray-700)]">Paid Out</span>
                    <span className="text-green-600 font-semibold">$50,183,094</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-[var(--casita-gray-50)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[var(--casita-orange)]/10 px-4 py-2 rounded-full mb-4">
              <Zap className="w-4 h-4 text-[var(--casita-orange)]" />
              <span className="text-[var(--casita-orange)] font-semibold text-sm">Powered by AI & Software</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--casita-gray-900)] mb-4">
              Comprehensive Property Solutions
            </h2>
            <p className="text-lg text-[var(--casita-gray-600)] max-w-3xl mx-auto">
              Casita leverages proprietary technology and industry-leading third-party software to guarantee the best ADR and occupancy rates across our entire portfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Channel Management */}
            <div className="bg-white rounded-2xl p-8 border border-[var(--casita-gray-100)] hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-3">
                Airbnb & Booking.com Management
              </h3>
              <p className="text-[var(--casita-gray-600)] mb-4">
                Unlock new booking opportunities with our specialized channel management solution, designed to seamlessly connect and optimize listings across platforms.
              </p>
              <ul className="space-y-2 text-sm text-[var(--casita-gray-600)]">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Listing optimization</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Dynamic pricing</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Multi-platform sync</li>
              </ul>
            </div>

            {/* 24/7 Support */}
            <div className="bg-white rounded-2xl p-8 border border-[var(--casita-gray-100)] hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-3">
                24/7 Digital Front Desk
              </h3>
              <p className="text-[var(--casita-gray-600)] mb-4">
                Bilingual guest support via instant messaging, helping connect with guests, increase 5-star reviews, and grow bookings without extra hires.
              </p>
              <ul className="space-y-2 text-sm text-[var(--casita-gray-600)]">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> English & Spanish support</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Proactive issue resolution</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Review management</li>
              </ul>
            </div>

            {/* Full Management */}
            <div className="bg-white rounded-2xl p-8 border border-[var(--casita-gray-100)] hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-3">
                Bespoke Property Management
              </h3>
              <p className="text-[var(--casita-gray-600)] mb-4">
                Customized management that integrates with your operations, from filling unsold rooms to complete day-to-day management.
              </p>
              <ul className="space-y-2 text-sm text-[var(--casita-gray-600)]">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Interior design & photography</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Housekeeping & maintenance</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Property automation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--casita-gray-900)] mb-4">
              The Casita Advantage
            </h2>
            <p className="text-lg text-[var(--casita-gray-600)]">Financial and operational benefits of partnering with us</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-[var(--casita-gray-50)]">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Payroll Savings</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">Digital guest support cuts down on front desk and housekeeping needs.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[var(--casita-gray-50)]">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Financial Clarity</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">Real-time analytics and P&L statements for full transparency.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[var(--casita-gray-50)]">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Security & Payments</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">$1M liability + $1M damage insurance per reservation.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[var(--casita-gray-50)]">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">No Empty Rooms</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">Dynamic pricing fills rooms aligned with your rate guidelines.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[var(--casita-gray-50)]">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Advanced Technology</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">Access our hospitality software suite at no extra cost.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[var(--casita-gray-50)]">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Flexible Partnership</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">Month-to-month agreement, no long-term commitments.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-[var(--casita-orange)] to-[var(--casita-orange-dark)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Getting Started is Easy
            </h2>
            <p className="text-xl text-white/80">Increasing sales with Casita is as easy as 1-2-3!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-[var(--casita-orange)]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Showcase Your Property</h3>
              <p className="text-white/80">From interior design and professional photography to property automation—we ensure your space looks its best.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-[var(--casita-orange)]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Tailor Listing & Rates</h3>
              <p className="text-white/80">We customize room listings and dynamic rates across platforms, optimizing each to resonate with the target audience.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-[var(--casita-orange)]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Enjoy Increased Bookings</h3>
              <p className="text-white/80">Sit back and relax as Casita handles everything from bookings to guest communications, maximizing revenue.</p>
            </div>
          </div>

          {/* Switch & Fast Onboarding Highlights */}
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--casita-orange)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Switching from Another Company?</h3>
                  <p className="text-white/80 text-sm">
                    If you're currently under a management agreement with another company, we can match or improve their pricing for the same services. Let's talk about how we can do better for you.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--casita-orange)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Fast Onboarding, High Occupancy</h3>
                  <p className="text-white/80 text-sm">
                    Get your property live and earning within a week. Our streamlined onboarding process ensures you start seeing bookings fast with maximum occupancy rates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-[var(--casita-gray-900)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Maximize Your Revenue?
            </h2>
            <p className="text-xl text-[var(--casita-gray-400)]">
              Let's discuss how Casita can help your property reach its full potential.
            </p>
          </div>

          {isSubmitted ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-[var(--casita-gray-900)] mb-4">
                Thank you for your interest!
              </h3>
              <p className="text-[var(--casita-gray-600)]">Our team will contact you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Property Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, propertyType: 'vacation' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                        formData.propertyType === 'vacation'
                          ? 'bg-[var(--casita-orange)] text-white border-[var(--casita-orange)]'
                          : 'border-[var(--casita-gray-200)] hover:border-[var(--casita-gray-400)]'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      <span className="text-sm">Vacation Rental</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, propertyType: 'hotel' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                        formData.propertyType === 'hotel'
                          ? 'bg-[var(--casita-orange)] text-white border-[var(--casita-orange)]'
                          : 'border-[var(--casita-gray-200)] hover:border-[var(--casita-gray-400)]'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm">Hotel</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Property Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                    placeholder="Miami Beach, FL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Number of Units</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                    placeholder="1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">Message</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] resize-none"
                    placeholder="Tell us about your property..."
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 bg-[var(--casita-orange)] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Get Started</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
