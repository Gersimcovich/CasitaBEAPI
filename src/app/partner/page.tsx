'use client';

import { useState, useEffect } from 'react';
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
  const [totalReviews, setTotalReviews] = useState(60777); // Default fallback
  const [totalGuestsHosted, setTotalGuestsHosted] = useState(182331); // Default fallback

  // Fetch stats on mount (cached for 24 hours on server)
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          if (data.data.totalReviews) {
            setTotalReviews(data.data.totalReviews);
          }
          if (data.data.totalGuestsHosted) {
            setTotalGuestsHosted(data.data.totalGuestsHosted);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep default values
      }
    }
    fetchStats();
  }, []);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setSubmitError(result.error || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Failed to submit. Please try again or email us at info@hellocasita.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Superhost Focus */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* YouTube Video Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 scale-150">
            <iframe
              src="https://www.youtube.com/embed/MWLCxiaRk9k?autoplay=1&mute=1&loop=1&playlist=MWLCxiaRk9k&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=12"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] min-w-full min-h-full"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/70" />
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
                {/* Airbnb Superhost Badge */}
                <img
                  src="/airbnb-superhost.png"
                  alt="Airbnb Superhost"
                  className="h-24 md:h-32 w-auto mx-auto mb-4"
                />
                <div className="text-5xl font-bold text-[var(--casita-gray-900)] mb-2">{totalReviews.toLocaleString()}</div>
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
                  <div className="text-sm text-[var(--casita-gray-500)] mb-2">Guests Hosted</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--casita-gray-700)]">Total</span>
                    <span className="text-green-600 font-semibold">{totalGuestsHosted.toLocaleString()} guests</span>
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
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Human & AI customer service</li>
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

              {submitError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {submitError}
                </div>
              )}

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
