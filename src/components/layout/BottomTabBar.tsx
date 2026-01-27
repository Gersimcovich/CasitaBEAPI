'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, CalendarCheck, User } from 'lucide-react';
import { useCapacitor } from '@/hooks/useCapacitor';
import { useUser } from '@/contexts/UserContext';

const tabs = [
  { href: '/', icon: Home, label: 'Explore' },
  { href: '/properties', icon: Search, label: 'Search' },
  { href: '/reservation', icon: CalendarCheck, label: 'Trips' },
  { href: '/account', icon: User, label: 'Profile' },
];

export default function BottomTabBar() {
  const { isCapacitor, isIOS } = useCapacitor();
  const { isAuthenticated } = useUser();
  const pathname = usePathname();

  // Only render in Capacitor (native app) mode
  if (!isCapacitor) return null;

  // Hide on checkout and property detail pages (they have their own nav)
  if (pathname.startsWith('/checkout')) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--casita-gray-100)]"
      style={isIOS ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'text-[var(--casita-orange)]'
                  : 'text-[var(--casita-gray-400)]'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-0.5 ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
