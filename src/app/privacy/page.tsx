'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-[var(--casita-gray-50)] to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--casita-gray-900)] mb-4">
              Privacy Policy
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

            <p className="text-[var(--casita-gray-600)] mb-6">
              Casita Vacation Rentals LLC, a Florida limited liability company ("Casita," "we," "us,"
              or "our"), is committed to protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you visit our website or use
              our services.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              1. Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-[var(--casita-gray-800)] mt-6 mb-3">
              Personal Information
            </h3>
            <p className="text-[var(--casita-gray-600)] mb-4">
              We may collect personal information that you voluntarily provide, including:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Billing and payment information</li>
              <li>Government-issued ID for verification purposes</li>
              <li>Communication preferences</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--casita-gray-800)] mt-6 mb-3">
              Automatically Collected Information
            </h3>
            <p className="text-[var(--casita-gray-600)] mb-4">
              When you visit our website, we may automatically collect:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and operating system</li>
              <li>Pages visited and time spent on our site</li>
              <li>Referring website addresses</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>Process and manage your reservations</li>
              <li>Communicate with you about your bookings</li>
              <li>Provide 24/7 guest support services</li>
              <li>Send promotional materials (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
              <li>Protect against fraudulent or unauthorized transactions</li>
            </ul>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              3. Information Sharing
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>Property owners (limited to information necessary for your stay)</li>
              <li>Third-party booking platforms (Airbnb, VRBO, etc.)</li>
              <li>Payment processors for secure transactions</li>
              <li>Service providers who assist our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="text-[var(--casita-gray-600)] mb-6">
              We do not sell your personal information to third parties.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              4. Data Security
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              We implement appropriate technical and organizational security measures to protect your
              personal information against unauthorized access, alteration, disclosure, or destruction.
              However, no method of transmission over the Internet or electronic storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              5. Cookies and Tracking
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              We use cookies and similar tracking technologies to enhance your experience on our website.
              You can control cookie preferences through your browser settings. Disabling cookies may
              affect certain features of our website.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              6. Your Rights
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-[var(--casita-gray-600)] mb-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
            </ul>
            <p className="text-[var(--casita-gray-600)] mb-6">
              To exercise these rights, please contact us using the information provided below.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              7. Children's Privacy
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal information from children. If you believe we have collected information
              from a child, please contact us immediately.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              8. Third-Party Links
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Our website may contain links to third-party websites. We are not responsible for the
              privacy practices of these external sites. We encourage you to review their privacy
              policies before providing any personal information.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              We may update this Privacy Policy from time to time. Changes will be posted on this page
              with an updated revision date. We encourage you to review this policy periodically.
            </p>

            <h2 className="text-2xl font-bold text-[var(--casita-gray-900)] mt-8 mb-4">
              10. Contact Us
            </h2>
            <p className="text-[var(--casita-gray-600)] mb-6">
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us:
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
