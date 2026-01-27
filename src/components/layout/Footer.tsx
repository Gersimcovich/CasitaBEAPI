'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Mail, Phone, Award, ExternalLink } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useCapacitor } from '@/hooks/useCapacitor';

export default function Footer() {
  const { t } = useLocale();
  const { isCapacitor } = useCapacitor();
  const currentYear = new Date().getFullYear();

  // Hide footer in native app — bottom tab bar replaces it
  if (isCapacitor) return null;

  return (
    <footer className="bg-[var(--casita-orange)] text-white relative overflow-hidden">
      {/* Decorative illustrations */}
      <img
        src="/parrot-transparent.png"
        alt=""
        className="absolute right-4 md:right-12 top-4 w-12 md:w-16 h-auto opacity-25 pointer-events-none"
      />
      <img
        src="/cafecito.webp"
        alt=""
        className="absolute left-4 md:left-8 top-6 w-14 md:w-18 h-auto opacity-20 pointer-events-none"
      />
      <img
        src="/island-palm.png"
        alt=""
        className="absolute right-[20%] md:right-[25%] bottom-16 md:bottom-20 w-20 md:w-28 h-auto opacity-15 pointer-events-none hidden sm:block"
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
            <div className="flex items-center gap-4">
              <div className="flex space-x-3">
                <a
                  href="https://www.instagram.com/casitastays"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/20 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                  title="Follow us on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/17866947577"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/20 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                  title="Chat with us on WhatsApp"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
              {/* Payment badges inline with social */}
              <div className="hidden md:flex items-center gap-1.5">
                <div className="bg-white/90 rounded px-1.5 py-0.5" title="Visa">
                  <span className="text-[#1A1F71] text-[10px] font-bold italic">VISA</span>
                </div>
                <div className="bg-white/90 rounded px-1 py-0.5 flex items-center" title="Mastercard">
                  <span className="w-2.5 h-2.5 bg-[#EB001B] rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-[#F79E1B] rounded-full -ml-1"></span>
                </div>
                <div className="bg-[#006FCF] rounded px-1.5 py-0.5" title="American Express">
                  <span className="text-white text-[10px] font-bold">AMEX</span>
                </div>
                <div className="bg-[#FFB3C7] rounded px-1.5 py-0.5" title="Klarna">
                  <span className="text-black text-[10px] font-bold">Klarna</span>
                </div>
                <div className="bg-[#0FA0EA] rounded px-1.5 py-0.5" title="Affirm">
                  <span className="text-white text-[10px] font-bold">affirm</span>
                </div>
              </div>
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
                <a href="mailto:reservations@hellocasita.com" className="text-white/80 hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  reservations@hellocasita.com
                </a>
              </li>
              <li>
                <a href="tel:+17866947577" className="text-white/80 hover:text-white transition-colors flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  (786) 694-7577
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Superhost / Airbnb Reviews */}
        <div className="border-t border-white/20 mt-6 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a
              href="https://www.airbnb.com/p/casita"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full transition-colors"
            >
              <Award className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">Verified Superhost</span>
              <span className="text-white/60 text-sm">|</span>
              <span className="text-sm">60,000+ Reviews on Airbnb</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/70" />
            </a>
          </div>
        </div>

        {/* Bottom Bar - Inline */}
        <div className="border-t border-white/20 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/70 text-xs">
              &copy; {currentYear} Hello Casita. {t.footer.rights}
            </p>

            {/* Payment Methods - Mobile only (desktop shows next to social icons) */}
            <div className="flex md:hidden items-center gap-1.5 flex-wrap justify-center">
              <span className="text-white/60 text-xs mr-1">We accept</span>
              <div className="bg-white/90 rounded px-1.5 py-0.5" title="Visa">
                <span className="text-[#1A1F71] text-[10px] font-bold italic">VISA</span>
              </div>
              <div className="bg-white/90 rounded px-1 py-0.5 flex items-center" title="Mastercard">
                <span className="w-2.5 h-2.5 bg-[#EB001B] rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-[#F79E1B] rounded-full -ml-1"></span>
              </div>
              <div className="bg-[#006FCF] rounded px-1.5 py-0.5" title="American Express">
                <span className="text-white text-[10px] font-bold">AMEX</span>
              </div>
              <div className="bg-[#FFB3C7] rounded px-1.5 py-0.5" title="Klarna">
                <span className="text-black text-[10px] font-bold">Klarna</span>
              </div>
              <div className="bg-[#0FA0EA] rounded px-1.5 py-0.5" title="Affirm">
                <span className="text-white text-[10px] font-bold">affirm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
