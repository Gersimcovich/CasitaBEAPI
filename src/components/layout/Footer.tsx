'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter, Linkedin, Mail, Phone } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function Footer() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--casita-orange)] text-white relative overflow-hidden">
      {/* Decorative Cafecito - left side */}
      <img
        src="/cafecito.webp"
        alt=""
        className="absolute left-4 md:left-8 top-8 w-16 md:w-20 h-auto opacity-20"
      />

      {/* Decorative Palm frond - right side */}
      <img
        src="/palm.webp"
        alt=""
        className="absolute -right-4 md:right-4 bottom-8 w-20 md:w-28 h-auto opacity-20"
      />

      {/* Main Footer Content - Compact */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/logo-white.png"
              alt="Casita"
              width={120}
              height={40}
              className="h-8 w-auto mb-3"
            />
            <p className="text-white/80 text-sm mb-4 max-w-xs">
              {t.footer.aboutText}
            </p>
            <div className="flex space-x-3">
              <a
                href="https://instagram.com/hellocasita"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com/hellocasita"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/hellocasita"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/hellocasita"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties" className="text-white/80 hover:text-white transition-colors">
                  {t.nav.properties}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-white transition-colors">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/80 hover:text-white transition-colors">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{t.footer.support}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-white/80 hover:text-white transition-colors">
                  {t.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="text-white/80 hover:text-white transition-colors">
                  {t.footer.cancellationOptions}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-sm mb-3">{t.footer.legal}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-white/80 hover:text-white transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/80 hover:text-white transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:hello@hellocasita.com" className="text-white/80 hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  hello@hellocasita.com
                </a>
              </li>
              <li>
                <a href="tel:+18001234567" className="text-white/80 hover:text-white transition-colors flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  1-800-CASITA
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Inline */}
        <div className="border-t border-white/20 mt-6 pt-4">
          <p className="text-white/70 text-xs text-center">
            &copy; {currentYear} Hello Casita. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
