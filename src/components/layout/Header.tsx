'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingCart, User, Trash2, LogOut, Award, Settings, Tag, HelpCircle, Building2, ChevronDown, CalendarCheck } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';
import { useCapacitor } from '@/hooks/useCapacitor';
import AuthModal from '@/components/auth/AuthModal';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { t } = useLocale();
  const { cartItem, hasCartItem, clearCart } = useCart();
  const { user, isAuthenticated, logout } = useUser();
  const [isCartHovered, setIsCartHovered] = useState(false);
  const cartHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isCapacitor, isIOS } = useCapacitor();

  const handleCartMouseEnter = () => {
    if (cartHoverTimeoutRef.current) {
      clearTimeout(cartHoverTimeoutRef.current);
      cartHoverTimeoutRef.current = null;
    }
    setIsCartHovered(true);
  };

  const handleCartMouseLeave = () => {
    cartHoverTimeoutRef.current = setTimeout(() => {
      setIsCartHovered(false);
    }, 150);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      // For app: hide immediately when scrolling down, show when scrolling up
      // For website: only hide after scrolling past 100px
      const scrollThreshold = isCapacitor ? 10 : 100;

      if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setIsHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isCapacitor]);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  // State for app user menu
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);

  // Close app menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsAppMenuOpen(false);
    };
    if (isAppMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isAppMenuOpen]);

  // App-specific header (simplified for iOS/Android app)
  if (isCapacitor) {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
          isScrolled ? 'shadow-md' : ''
        }`}
        style={isIOS ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/casita-logo.png"
                alt="Casita"
                width={120}
                height={32}
                className="h-7 w-auto"
                priority
              />
            </Link>

            {/* Right Side - Person Icon with Dropdown (all nav in menu) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAppMenuOpen(!isAppMenuOpen);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isAuthenticated
                    ? 'bg-[var(--casita-gray-900)] text-white'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                {isAuthenticated && user ? (
                  <span className="text-sm font-semibold">{user.firstName[0]}</span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {/* App User Dropdown Menu */}
              {isAppMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[var(--casita-gray-100)] py-2 animate-scale-in z-50">
                  {isAuthenticated && user ? (
                    <>
                      {/* Logged in user header */}
                      <div className="px-4 py-3 border-b border-[var(--casita-gray-100)]">
                        <p className="font-semibold text-[var(--casita-gray-900)]">{user.firstName} {user.lastName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Award className="w-4 h-4 text-[var(--casita-orange)]" />
                          <span className="text-sm font-semibold text-[var(--casita-orange)]">{user.casitaPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/properties"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <Building2 className="w-4 h-4" />
                          {t.nav.properties}
                        </Link>
                        <Link
                          href="/reservation"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <CalendarCheck className="w-4 h-4" />
                          {t.nav.manageReservation || 'My Reservation'}
                        </Link>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.myAccount || 'My Account'}
                        </Link>
                        <Link
                          href="/help"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <HelpCircle className="w-4 h-4" />
                          {t.footer.helpCenter}
                        </Link>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <button
                          onClick={async () => {
                            await logout();
                            setIsAppMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.nav.logout || 'Log out'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest user */}
                      <div className="py-1">
                        <Link
                          href="/properties"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <Building2 className="w-4 h-4" />
                          {t.nav.properties}
                        </Link>
                        <Link
                          href="/reservation"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <CalendarCheck className="w-4 h-4" />
                          {t.nav.manageReservation || 'My Reservation'}
                        </Link>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsAppMenuOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] font-medium"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.login}
                        </button>
                        <button
                          onClick={() => {
                            setIsAppMenuOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <Award className="w-4 h-4" />
                          {t.nav.signup}
                        </button>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <Link
                          href="/help"
                          onClick={() => setIsAppMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <HelpCircle className="w-4 h-4" />
                          {t.footer.helpCenter}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </header>
    );
  }

  // Website header (full navigation)
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? 'shadow-md' : ''
      } ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 lg:h-20">
          {/* Logo - Fixed width for balance */}
          <div className="w-[160px] flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/casita-logo.png"
                alt="Casita"
                width={156}
                height={40}
                className="h-8 lg:h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation - True center with flex-1 */}
          <nav className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1">
              {/* Stays */}
              <Link
                href="/properties"
                className="flex items-center gap-2 px-4 py-2 text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)] hover:bg-[var(--casita-cream)] rounded-lg transition-colors font-medium"
              >
                <Building2 className="w-4 h-4" />
                {t.nav.properties}
              </Link>

              {/* Deals */}
              <Link
                href="/deals"
                className="flex items-center gap-2 px-4 py-2 text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)] hover:bg-[var(--casita-cream)] rounded-lg transition-colors font-medium"
              >
                <Tag className="w-4 h-4" />
                {t.nav.deals || 'Deals'}
              </Link>

              {/* Manage Reservation */}
              <Link
                href="/reservation"
                className="flex items-center gap-2 px-4 py-2 text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)] hover:bg-[var(--casita-cream)] rounded-lg transition-colors font-medium"
              >
                <CalendarCheck className="w-4 h-4" />
                {t.nav.manageReservation || 'My Reservation'}
              </Link>

              {/* Help */}
              <Link
                href="/help"
                className="flex items-center gap-2 px-4 py-2 text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)] hover:bg-[var(--casita-cream)] rounded-lg transition-colors font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                {t.footer.helpCenter}
              </Link>
            </div>
          </nav>

          {/* Right Side Actions - Match logo width for balance */}
          <div className="hidden lg:flex items-center justify-end space-x-3 w-[200px] flex-shrink-0">
            {/* Partner CTA - Always visible */}
            <Link
              href="/partner"
              className="px-4 py-2 text-[var(--casita-gray-700)] hover:text-[var(--casita-orange)] font-medium transition-colors whitespace-nowrap"
            >
              {t.nav.partner}
            </Link>

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
                    : 'text-[var(--casita-gray-500)] hover:bg-gray-100'
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
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all hover:shadow-md ${
                  isAuthenticated
                    ? 'border-[var(--casita-gray-900)] bg-[var(--casita-gray-900)] text-white'
                    : 'border-[var(--casita-gray-300)] text-[var(--casita-gray-900)] hover:border-[var(--casita-gray-900)]'
                }`}
              >
                <Menu className="w-4 h-4" />
                {isAuthenticated && user ? (
                  <span className="w-7 h-7 bg-white text-[var(--casita-gray-900)] rounded-full flex items-center justify-center text-sm font-semibold">
                    {user.firstName[0]}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[var(--casita-gray-100)] py-2 animate-scale-in">
                  {isAuthenticated && user ? (
                    <>
                      {/* Logged in user header */}
                      <div className="px-4 py-3 border-b border-[var(--casita-gray-100)]">
                        <p className="font-semibold text-[var(--casita-gray-900)]">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-[var(--casita-gray-500)] truncate">{user.email}</p>
                        <div className="flex items-center gap-1 mt-2 bg-[var(--casita-cream)] px-2 py-1 rounded-lg w-fit">
                          <Award className="w-4 h-4 text-[var(--casita-orange)]" />
                          <span className="text-sm font-semibold text-[var(--casita-orange)]">{user.casitaPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.myAccount || 'My Account'}
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <Settings className="w-4 h-4" />
                          {t.nav.settings || 'Settings'}
                        </Link>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <Link
                          href="/help"
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <HelpCircle className="w-4 h-4" />
                          {t.footer.helpCenter}
                        </Link>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <button
                          onClick={async () => {
                            await logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.nav.logout || 'Log out'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest user */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] font-medium"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.login}
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <Award className="w-4 h-4" />
                          {t.nav.signup}
                        </button>
                      </div>
                      <hr className="my-1 border-[var(--casita-gray-100)]" />
                      <div className="py-1">
                        <Link
                          href="/help"
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)]"
                        >
                          <HelpCircle className="w-4 h-4" />
                          {t.footer.helpCenter}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button - pushed to right */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden ml-auto p-2 rounded-lg transition-colors text-[var(--casita-gray-700)]"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white rounded-b-xl shadow-lg border-t border-[var(--casita-gray-100)] animate-scale-in">
            <nav className="py-4 px-2">
              {/* Main Nav Links */}
              <div className="space-y-1 mb-4">
                <Link
                  href="/properties"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-cream)] rounded-xl font-medium"
                >
                  <Building2 className="w-5 h-5 text-[var(--casita-orange)]" />
                  {t.nav.properties}
                </Link>
                <Link
                  href="/deals"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-cream)] rounded-xl font-medium"
                >
                  <Tag className="w-5 h-5 text-[var(--casita-orange)]" />
                  {t.nav.deals || 'Deals'}
                </Link>
                <Link
                  href="/reservation"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-cream)] rounded-xl font-medium"
                >
                  <CalendarCheck className="w-5 h-5 text-[var(--casita-orange)]" />
                  {t.nav.manageReservation || 'My Reservation'}
                </Link>
                <Link
                  href="/help"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-cream)] rounded-xl font-medium"
                >
                  <HelpCircle className="w-5 h-5 text-[var(--casita-orange)]" />
                  {t.footer.helpCenter}
                </Link>
              </div>

              {/* Partner CTA */}
              <div className="px-2 mb-4">
                <Link
                  href="/partner"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 text-center border-2 border-[var(--casita-orange)] text-[var(--casita-orange)] rounded-xl font-semibold hover:bg-[var(--casita-orange)] hover:text-white transition-colors"
                >
                  {t.nav.partner}
                </Link>
              </div>

              {/* Cart */}
              {hasCartItem && cartItem && (
                <div className="px-2 mb-4">
                  <div className="flex items-center gap-2 p-3 bg-[var(--casita-cream)] rounded-xl">
                    <Link
                      href={`/property/${cartItem.propertySlug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center gap-3"
                    >
                      <ShoppingCart className="w-5 h-5 text-[var(--casita-orange)]" />
                      <span className="text-sm font-medium text-[var(--casita-gray-700)] truncate">
                        Continue: {cartItem.propertyName.substring(0, 25)}...
                      </span>
                    </Link>
                    <button
                      onClick={() => clearCart()}
                      className="p-2 text-[var(--casita-gray-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Divider */}
              <hr className="mx-4 my-4 border-[var(--casita-gray-100)]" />

              {/* User Section */}
              <div className="px-2">
                {isAuthenticated && user ? (
                  <>
                    {/* Logged in user */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-[var(--casita-gray-50)] rounded-xl mb-3">
                      <div className="w-10 h-10 bg-[var(--casita-gray-900)] text-white rounded-full flex items-center justify-center font-semibold">
                        {user.firstName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--casita-gray-900)]">{user.firstName}</p>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-[var(--casita-orange)]" />
                          <span className="text-xs font-medium text-[var(--casita-orange)]">{user.casitaPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-xl"
                    >
                      <User className="w-5 h-5" />
                      {t.nav.myAccount || 'My Account'}
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-xl"
                    >
                      <LogOut className="w-5 h-5" />
                      {t.nav.logout || 'Log out'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Guest user */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full px-4 py-3 bg-[var(--casita-gray-900)] text-white rounded-xl font-semibold mb-2"
                    >
                      {t.nav.signup}
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full px-4 py-3 text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-50)] rounded-xl font-medium"
                    >
                      {t.nav.login}
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
