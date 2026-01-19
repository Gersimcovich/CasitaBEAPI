'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Heart, User } from 'lucide-react';
import LocaleSelector from '@/components/LocaleSelector';
import { useLocale } from '@/contexts/LocaleContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t, isLoading } = useLocale();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-white/80 backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo - Black & Orange transparent */}
          <Link href="/" className="flex items-center">
            <Image
              src="/casita-logo.png"
              alt="Casita"
              width={140}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/properties"
              className="font-medium transition-colors text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)]"
            >
              {t.nav.properties}
            </Link>
            <Link
              href="/about"
              className="font-medium transition-colors text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)]"
            >
              {t.nav.about}
            </Link>
            <Link
              href="/contact"
              className="font-medium transition-colors text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)]"
            >
              {t.nav.contact}
            </Link>
            <Link
              href="/partner"
              className="font-medium transition-colors text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)]"
            >
              {t.nav.partner}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language/Currency Selector */}
            {!isLoading && (
              <div className="rounded-lg">
                <LocaleSelector />
              </div>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2 rounded-full transition-colors hover:bg-[var(--casita-orange)] hover:bg-opacity-20 text-[var(--casita-gray-700)]"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center space-x-2 p-2 rounded-full border transition-colors border-[var(--casita-gray-300)] text-[var(--casita-gray-700)] hover:shadow-md"
              >
                <Menu className="w-4 h-4" />
                <User className="w-5 h-5" />
              </button>

              {/* Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--casita-gray-100)] py-2 animate-scale-in">
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-2 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                  >
                    {t.nav.signup}
                  </Link>
                  <hr className="my-2 border-[var(--casita-gray-100)]" />
                  <Link
                    href="/host"
                    className="block px-4 py-2 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                  >
                    List your property
                  </Link>
                  <Link
                    href="/help"
                    className="block px-4 py-2 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                  >
                    {t.footer.helpCenter}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors text-[var(--casita-gray-700)]"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-xl shadow-lg p-4 animate-scale-in">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/properties"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.properties}
              </Link>
              <Link
                href="/about"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.about}
              </Link>
              <Link
                href="/contact"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.contact}
              </Link>
              <Link
                href="/partner"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.partner}
              </Link>
              <hr className="my-2 border-[var(--casita-gray-100)]" />

              {/* Mobile Locale Selector */}
              {!isLoading && (
                <div className="px-4 py-2">
                  <LocaleSelector />
                </div>
              )}

              <hr className="my-2 border-[var(--casita-gray-100)]" />
              <Link
                href="/login"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/signup"
                className="px-4 py-3 bg-[var(--casita-orange)] text-white rounded-lg text-center font-medium"
              >
                {t.nav.signup}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
