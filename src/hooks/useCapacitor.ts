'use client';

import { useState, useEffect } from 'react';

interface CapacitorInfo {
  isCapacitor: boolean;
  platform: 'ios' | 'android' | 'web';
  isIOS: boolean;
  isAndroid: boolean;
  isReady: boolean; // True once we've checked the environment
}

export function useCapacitor(): CapacitorInfo {
  const [info, setInfo] = useState<CapacitorInfo>({
    isCapacitor: false,
    platform: 'web',
    isIOS: false,
    isAndroid: false,
    isReady: false,
  });

  useEffect(() => {
    // Check if running in Capacitor environment
    const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;

    if (capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()) {
      const platform = capacitor.getPlatform?.() || 'web';
      setInfo({
        isCapacitor: true,
        platform: platform as 'ios' | 'android' | 'web',
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        isReady: true,
      });
    } else {
      // Not in Capacitor, but we've checked
      setInfo(prev => ({ ...prev, isReady: true }));
    }
  }, []);

  return info;
}
