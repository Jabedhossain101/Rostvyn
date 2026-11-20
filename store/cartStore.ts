"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantName: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  isOpen: boolean;
  lastAddedNotice: string | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  setPromoCode: (code: string | null) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearNotice: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: null,
      isOpen: false,
      lastAddedNotice: null,

      addItem: (item, quantity = 1) =>
        set((state) => {
          if (item.maxStock <= 0 || quantity <= 0) {
            return state;
          }

          const existing = state.items.find((i) => i.variantId === item.variantId);
          let nextItems: CartItem[];

          if (existing) {
            const nextQty = Math.min(item.maxStock, existing.quantity + quantity);
            nextItems = state.items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: nextQty, price: item.price, maxStock: item.maxStock }
                : i
            );
          } else {
            nextItems = [
              ...state.items,
              {
                ...item,
                quantity: Math.min(item.maxStock, quantity),
              },
            ];
          }

          return {
            items: nextItems,
            lastAddedNotice: `${item.name} (${item.variantName}) added to bag`,
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.variantId !== variantId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: Math.min(i.maxStock, quantity) }
                : i
            ),
          };
        }),

      setPromoCode: (code) => set({ promoCode: code }),
      clearCart: () => set({ items: [], promoCode: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clearNotice: () => set({ lastAddedNotice: null }),
    }),
    {
      name: "rostvyn-cart-v1",
      partialize: (state) => ({ items: state.items, promoCode: state.promoCode }),
    }
  )
);
