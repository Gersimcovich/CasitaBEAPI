'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingCart, User, Trash2 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t } = useLocale();
  const { cartItem, hasCartItem, clearCart } = useCart();
  const [isCartHovered, setIsCartHovered] = useState(false);
  const cartHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCartMouseEnter = () => {
    if (cartHoverTimeoutRef.current) {
      clearTimeout(cartHoverTimeoutRef.current);
      cartHoverTimeoutRef.current = null;
    }
    setIsCartHovered(true);
  };

  const handleCartMouseLeave = () => {
    // Small delay to allow mouse to move to dropdown
    cartHoverTimeoutRef.current = setTimeout(() => {
      setIsCartHovered(false);
    }, 150);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Update scrolled state for shadow
      setIsScrolled(currentScrollY > 50);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold - hide header
        setIsHidden(true);
      } else {
        // Scrolling up - show header
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? 'shadow-md py-3' : 'py-5'
      } ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
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
              href="/partner"
              className="font-medium transition-colors text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)]"
            >
              {t.nav.partner}
            </Link>
            <Link
              href="/contact"
              className="font-medium transition-colors text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)]"
            >
              {t.nav.contact}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart */}
            <div
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <Link
                href={hasCartItem && cartItem ? `/property/${cartItem.propertySlug}` : '#'}
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors relative ${
                  hasCartItem
                    ? 'bg-orange-50 text-[var(--casita-orange)] hover:bg-orange-100'
                    : 'text-[var(--casita-gray-700)] hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {hasCartItem && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--casita-orange)] rounded-full border-2 border-white" />
                )}
              </Link>

              {/* Cart Dropdown Preview */}
              {isCartHovered && hasCartItem && cartItem && (
                <>
                  {/* Invisible bridge to prevent gap issues */}
                  <div className="absolute right-0 top-full w-72 h-3" />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[var(--casita-gray-100)] p-4 animate-scale-in z-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[var(--casita-gray-500)]">Continue your booking</p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearCart();
                          setIsCartHovered(false);
                        }}
                        className="p-1.5 rounded-lg text-[var(--casita-gray-400)] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Link href={`/property/${cartItem.propertySlug}`} className="block">
                      <div className="flex gap-3">
                        {cartItem.propertyImage && (
                          <Image
                            src={cartItem.propertyImage}
                            alt={cartItem.propertyName}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover w-[60px] h-[60px] flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-medium text-sm text-[var(--casita-gray-900)] truncate">
                            {cartItem.propertyName}
                          </p>
                          <p className="text-xs text-[var(--casita-gray-500)] truncate">{cartItem.location}</p>
                          {cartItem.checkIn && cartItem.checkOut && (
                            <p className="text-xs text-[var(--casita-orange)] mt-1">
                              {new Date(cartItem.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(cartItem.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>

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
                href="/partner"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.partner}
              </Link>
              <Link
                href="/contact"
                className="px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-lg"
              >
                {t.nav.contact}
              </Link>
              {/* Mobile Cart */}
              {hasCartItem && cartItem && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/property/${cartItem.propertySlug}`}
                    className="flex-1 px-4 py-3 text-[var(--casita-orange)] hover:bg-[var(--casita-orange)] hover:bg-opacity-10 rounded-lg flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Continue booking: {cartItem.propertyName.substring(0, 20)}...</span>
                  </Link>
                  <button
                    onClick={() => clearCart()}
                    className="p-3 text-[var(--casita-gray-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from cart"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
