// src/stores/inventoryCards.ts
import { defineStore } from 'pinia';
import { inventoryCardService } from '@/services/inventoryCardService';
import type { InventoryCard } from '@/services/inventoryCardService';

interface InventoryCardsState {
  cards: InventoryCard[];
  loading: boolean;
  error: string | null;
  currentProductId: string | null;
}

export const useInventoryCardsStore = defineStore('inventoryCards', {
  state: (): InventoryCardsState => ({
    cards: [],
    loading: false,
    error: null,
    currentProductId: null
  }),

  getters: {
    /**
     * Celkový počet skladových karet
     */
    totalCards: (state) => state.cards.length,

    /**
     * Celkový stav zásob napříč všemi sklady
     */
    totalStockQuantity: (state) => {
      return state.cards.reduce((sum, card) => sum + card.currentStockQuantity, 0);
    },

    /**
     * Celková hodnota zásob
     */
    totalStockValue: (state) => {
      return state.cards.reduce((sum, card) => sum + card.currentStockValue, 0);
    },

    /**
     * Průměrná nákupní cena
     */
    averageCostPrice: (state) => {
      if (state.cards.length === 0) return 0;
      const sum = state.cards.reduce((sum, card) => sum + card.averageCostPrice, 0);
      return sum / state.cards.length;
    },

    /**
     * Sklady s nízkým stavem zásob (< 10 ks)
     */
    lowStockCards: (state) => {
      return state.cards.filter(card => card.currentStockQuantity < 10);
    },

    /**
     * Sklady bez zásob
     */
    emptyStockCards: (state) => {
      return state.cards.filter(card => card.currentStockQuantity === 0);
    },

    /**
     * Sklady s dostupnými zásobami
     */
    availableStockCards: (state) => {
      return state.cards.filter(card => card.currentStockQuantity > 0);
    }
  },

  actions: {
    /**
     * Načte skladové karty pro daný produkt
     */
    async loadByProductId(productId: string) {
      this.loading = true;
      this.error = null;
      this.currentProductId = productId;

      try {
        this.cards = await inventoryCardService.getByProductId(productId);
        console.log('✅ Store: Načteno skladových karet:', this.cards.length);
      } catch (err: any) {
        this.error = err.message || 'Chyba při načítání skladových karet';
        console.error('❌ Store: Chyba při načítání skladových karet:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Vyčistí data ve store
     */
    clearCards() {
      this.cards = [];
      this.currentProductId = null;
      this.error = null;
    },

    /**
     * Najde skladovou kartu podle ID skladu
     */
    findByWarehouseId(warehouseId: string): InventoryCard | undefined {
      return this.cards.find(card => card.warehouseId === warehouseId);
    },

    /**
     * Filtruje karty podle účetního období
     */
    filterByAccountingPeriod(periodId: string): InventoryCard[] {
      return this.cards.filter(card => card.accountingPeriodId === periodId);
    }
  }
});