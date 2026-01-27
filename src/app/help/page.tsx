'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChevronDown, Phone, Mail, MessageCircle, Home, Calendar, CreditCard, Key, AlertCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Booking',
    icon: Calendar,
    questions: [
      {
        q: 'How do I make a reservation?',
        a: 'You can book directly through our website by selecting your desired property and dates, or through our listings on Airbnb, VRBO, and other major platforms. Once you submit a booking request, you\'ll receive a confirmation email within 24 hours.'
      },
      {
        q: 'What is the cancellation policy?',
        a: 'Our cancellation policy varies by property and is designed to balance flexibility for guests with protection for property owners. Please refer to your booking confirmation email for the specific cancellation terms that apply to your reservation. Common policies include: Flexible (full refund up to 24 hours before check-in), Moderate (full refund up to 5 days before check-in), and Firm (full refund up to 30 days before check-in, 50% refund up to 7 days before). Service fees may be non-refundable depending on the platform used for booking.'
      },
      {
        q: 'Can I modify my reservation?',
        a: 'Yes, reservation modifications are possible subject to availability. Please contact our guest support team at least 48 hours before your check-in date to request changes.'
      }
    ]
  },
  {
    category: 'Check-In & Check-Out',
    icon: Key,
    questions: [
      {
        q: 'What time is check-in and check-out?',
        a: 'Standard check-in time is 4:00 PM and check-out is 11:00 AM. Early check-in or late check-out may be available upon request, subject to availability and additional fees.'
      },
      {
        q: 'How do I access the property?',
        a: 'Most of our properties feature smart locks with keyless entry. You\'ll receive a unique access code via email or text message on the day of your arrival, along with detailed check-in instructions.'
      },
      {
        q: 'Is there someone available if I have problems checking in?',
        a: 'Yes! Our 24/7 bilingual guest support team is always available to assist you. If you experience any issues, call or text us immediately and we\'ll help resolve the problem.'
      }
    ]
  },
  {
    category: 'Payments',
    icon: CreditCard,
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as payments through Airbnb and other booking platforms. For longer stays, we may offer alternative payment arrangements.'
      },
      {
        q: 'Is there a security deposit?',
        a: 'Some properties require a refundable security deposit. The amount varies by property and will be clearly stated during the booking process. Deposits are typically refunded within 7 days of checkout, pending a damage inspection.'
      },
      {
        q: 'Are there any additional fees?',
        a: 'All fees are disclosed during the booking process. Common fees may include cleaning fees, resort fees (where applicable), and local taxes. There are no hidden charges.'
      }
    ]
  },
  {
    category: 'Property & Amenities',
    icon: Home,
    questions: [
      {
        q: 'What amenities are included?',
        a: 'Each property listing includes a detailed amenity list. Common amenities include WiFi, fully equipped kitchens, linens, towels, and toiletries. Pool, parking, and other amenities vary by property.'
      },
      {
        q: 'Are pets allowed?',
        a: 'Pet policies vary by property. Look for the pet-friendly filter when searching, or check the individual property listing. Where pets are allowed, additional fees and restrictions may apply.'
      },
      {
        q: 'Is parking available?',
        a: 'Parking availability varies by property. Many of our properties include free parking, while others may have street parking or paid garage options. Check the property listing for specific details.'
      }
    ]
  },
  {
    category: 'Issues & Support',
    icon: AlertCircle,
    questions: [
      {
        q: 'What if something is broken or not working?',
        a: 'Please report any issues immediately to our 24/7 support team. We have a network of maintenance professionals ready to address problems quickly. For urgent issues affecting safety or habitability, we prioritize rapid response.'
      },
      {
        q: 'What if I need to leave early?',
        a: 'If you need to check out early, please contact us as soon as possible. Refunds for early departures are subject to the property\'s cancellation policy and any applicable service fees.'
      },
      {
        q: 'How do I provide feedback about my stay?',
        a: 'We value your feedback! You\'ll receive a post-stay survey via email. You can also leave a review on the platform where you booked, or contact us directly with any comments or suggestions.'
      }
    ]
  }
];

export default function HelpPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-[var(--casita-gray-50)] to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--casita-gray-900)] mb-6">
              Help <span className="text-[var(--casita-orange)]">Center</span>
            </h1>
            <p className="text-xl text-[var(--casita-gray-600)]">
              Find answers to common questions or reach out to our 24/7 support team.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-8 border-b border-[var(--casita-gray-100)]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 md:gap-12">
            <a href="tel:+17866947577" className="flex items-center gap-3 text-[var(--casita-gray-600)] hover:text-[var(--casita-orange)] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <span>(786) 694-7577</span>
            </a>
            <a href="mailto:reservations@hellocasita.com" className="flex items-center gap-3 text-[var(--casita-gray-600)] hover:text-[var(--casita-orange)] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <span>reservations@hellocasita.com</span>
            </a>
            <div className="flex items-center gap-3 text-[var(--casita-gray-600)]">
              <div className="w-10 h-10 rounded-full bg-[var(--casita-turquoise)]/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[var(--casita-turquoise)]" />
              </div>
              <span>24/7 Bilingual Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              {faqs.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-[var(--casita-orange)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--casita-gray-900)]">
                      {category.category}
                    </h3>
                  </div>

                  <div className="space-y-3 ml-13">
                    {category.questions.map((item, idx) => {
                      const itemId = `${category.category}-${idx}`;
                      const isOpen = openItems.includes(itemId);

                      return (
                        <div
                          key={idx}
                          className="border border-[var(--casita-gray-200)] rounded-xl overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[var(--casita-gray-50)] transition-colors"
                          >
                            <span className="font-medium text-[var(--casita-gray-900)]">
                              {item.q}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-[var(--casita-gray-400)] transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4 text-[var(--casita-gray-600)]">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-[var(--casita-gray-50)]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mb-4">
              Still Need Help?
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Our guest support team is available 24 hours a day, 7 days a week in English and Spanish.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+17866947577"
                className="px-8 py-4 bg-[var(--casita-orange)] text-white font-semibold rounded-xl hover:bg-[var(--casita-orange)]/90 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Us Now
              </a>
              <a
                href="mailto:support@hellocasita.com"
                className="px-8 py-4 border-2 border-[var(--casita-gray-300)] text-[var(--casita-gray-700)] font-semibold rounded-xl hover:border-[var(--casita-orange)] hover:text-[var(--casita-orange)] transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-8 border-t border-[var(--casita-gray-100)]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-sm text-[var(--casita-gray-500)]">
            <p>
              Casita Vacation Rentals LLC, a Florida limited liability company<br />
              436 Ocean Dr, Miami Beach, FL 33139
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
