'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const subjectLabels: Record<string, string> = {
    general: 'General Inquiry',
    booking: 'Booking Question',
    partner: 'Partnership Opportunity',
    support: 'Guest Support'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Build email body with form data
    const subject = `${subjectLabels[formData.subject]} from ${formData.name}`;
    const body = `Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Subject: ${subjectLabels[formData.subject]}

Message:
${formData.message}`;

    // Open mailto link to send email directly
    const mailtoLink = `mailto:hola@hellocasita.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-[var(--casita-gray-50)] to-white relative overflow-hidden">
        {/* Hotel illustration decorations */}
        <img
          src="/hotel-illustration-1.png"
          alt=""
          className="absolute left-4 md:left-10 top-24 w-20 md:w-28 lg:w-36 h-auto opacity-20 rounded-xl"
        />
        <img
          src="/hotel-illustration-2.png"
          alt=""
          className="absolute right-4 md:right-10 top-24 w-20 md:w-28 lg:w-36 h-auto opacity-20 rounded-xl"
        />
        <img
          src="/hotel-illustration-3.png"
          alt=""
          className="absolute left-[15%] bottom-4 w-16 md:w-24 h-auto opacity-15 rounded-xl hidden md:block"
        />
        <img
          src="/hotel-illustration-5.png"
          alt=""
          className="absolute right-[15%] bottom-4 w-16 md:w-24 h-auto opacity-15 rounded-xl hidden md:block"
        />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--casita-gray-900)] mb-6">
              Contact <span className="text-[var(--casita-orange)]">Us</span>
            </h1>
            <p className="text-xl text-[var(--casita-gray-600)]">
              Have a question or want to partner with us? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mb-8">
                Get in Touch
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Address</h3>
                    <p className="text-[var(--casita-gray-600)]">
                      436 Ocean Dr<br />
                      Miami Beach, FL 33139
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Phone</h3>
                    <a href="tel:+17866947577" className="text-[var(--casita-gray-600)] hover:text-[var(--casita-orange)] transition-colors">
                      (786) 694-7577
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Email</h3>
                    <a href="mailto:hola@hellocasita.com" className="text-[var(--casita-gray-600)] hover:text-[var(--casita-orange)] transition-colors">
                      hola@hellocasita.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--casita-orange)]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[var(--casita-orange)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Guest Support</h3>
                    <p className="text-[var(--casita-gray-600)]">
                      24/7 Bilingual Support<br />
                      <span className="text-sm">English & Spanish</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mb-8">
                Send a Message
              </h2>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent!</h3>
                  <p className="text-green-700">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--casita-gray-200)] focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange)]/20 outline-none transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--casita-gray-200)] focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange)]/20 outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                      Phone <span className="text-[var(--casita-gray-400)]">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--casita-gray-200)] focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange)]/20 outline-none transition-all"
                      placeholder="(786) 694-7577"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--casita-gray-200)] focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange)]/20 outline-none transition-all bg-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="booking">Booking Question</option>
                      <option value="partner">Partnership Opportunity</option>
                      <option value="support">Guest Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--casita-gray-200)] focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange)]/20 outline-none transition-all resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[var(--casita-orange)] text-white font-semibold rounded-xl hover:bg-[var(--casita-orange)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
