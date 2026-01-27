'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-[var(--casita-gray-50)] to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--casita-gray-900)] mb-4">
              Terms of Service
            </h1>
            <p className="text-[var(--casita-gray-500)]">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg">

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              By accessing or using the services provided by Casita Vacation Rentals LLC, a Florida
              limited liability company ("Casita," "we," "us," or "our"), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              2. Services Description
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Casita provides vacation rental property management services, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>Property listing and marketing across multiple platforms</li>
              <li>Guest communication and booking management</li>
              <li>24/7 bilingual guest support</li>
              <li>Property maintenance coordination</li>
              <li>Revenue optimization and pricing management</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              3. Booking and Reservations
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              All bookings made through our platform or affiliated platforms are subject to availability
              and confirmation. By making a reservation, you agree to the specific terms and conditions
              of that property, including check-in/check-out times, house rules, and cancellation policies.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              4. Guest Responsibilities
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-4">
              As a guest, you agree to:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>Provide accurate information during booking</li>
              <li>Comply with all property rules and local laws</li>
              <li>Treat the property with care and respect</li>
              <li>Report any damages or issues promptly</li>
              <li>Not exceed the maximum occupancy stated for the property</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              5. Payment Terms
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Payment terms, including deposits, final payments, and refund policies, are specified
              at the time of booking. All payments are processed securely through our authorized
              payment processors. Prices are subject to applicable taxes and fees.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              6. Cancellation Policy
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Cancellation policies vary by property and are clearly stated at the time of booking.
              Please review the specific cancellation policy before confirming your reservation.
              Refunds, if applicable, will be processed according to the stated policy.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              7. Liability Limitations
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              To the maximum extent permitted by law, Casita Vacation Rentals LLC shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of our services. Our total liability shall not exceed the amount paid for your
              reservation.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              All content on this website, including text, graphics, logos, and images, is the property
              of Casita Vacation Rentals LLC or its content suppliers and is protected by intellectual
              property laws. You may not reproduce, distribute, or create derivative works without our
              express written permission.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              9. Governing Law
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              These Terms of Service shall be governed by and construed in accordance with the laws
              of the State of Florida, without regard to its conflict of law provisions. Any disputes
              arising under these terms shall be subject to the exclusive jurisdiction of the courts
              located in Miami-Dade County, Florida.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              We reserve the right to modify these Terms of Service at any time. Changes will be
              effective immediately upon posting to this website. Your continued use of our services
              after any changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              11. Contact Information
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-[var(--casita-gray-50)] rounded-xl p-6 text-[var(--casita-gray-600)]">
              <p className="font-semibold text-[var(--casita-gray-900)]">Casita Vacation Rentals LLC</p>
              <p>436 Ocean Dr</p>
              <p>Miami Beach, FL 33139</p>
              <p className="mt-2">Email: reservations@hellocasita.com</p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
