'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, HelpCircle } from 'lucide-react';
import { useCapacitor } from '@/hooks/useCapacitor';
import { useUser } from '@/contexts/UserContext';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/properties', icon: Search, label: 'Search' },
  { href: '/account', icon: User, label: 'Account' },
  { href: '/help', icon: HelpCircle, label: 'Help' },
];

export default function BottomTabBar() {
  const { isCapacitor, isIOS } = useCapacitor();
  const { isAuthenticated } = useUser();
  const pathname = usePathname();

  // Only render in Capacitor (native app) mode
  if (!isCapacitor) return null;

  // Hide on checkout pages
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
          const href = tab.href === '/account' && !isAuthenticated ? '/login' : tab.href;

          return (
            <Link
              key={tab.href}
              href={href}
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
