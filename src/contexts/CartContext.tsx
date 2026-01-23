'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Cart item represents a saved search at checkout point
export interface CartItem {
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  propertySlug: string;
  location: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  rooms: number;
  pricePerNight: number;
  totalPrice: number | null;
  currency: string;
  savedAt: string; // ISO timestamp
}

interface CartContextType {
  cartItem: CartItem | null;
  saveToCart: (item: CartItem) => void;
  clearCart: () => void;
  hasCartItem: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'casita-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItem, setCartItem] = useState<CartItem | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem;
        // Check if cart is less than 7 days old
        const savedDate = new Date(parsed.savedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff < 7) {
          setCartItem(parsed);
        } else {
          // Cart expired, clear it
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }, []);

  const saveToCart = useCallback((item: CartItem) => {
    const itemWithTimestamp = {
      ...item,
      savedAt: new Date().toISOString(),
    };
    setCartItem(itemWithTimestamp);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemWithTimestamp));
  }, []);

  const clearCart = useCallback(() => {
    setCartItem(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItem,
        saveToCart,
        clearCart,
        hasCartItem: cartItem !== null,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
