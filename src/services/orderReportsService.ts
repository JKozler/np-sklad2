// src/services/orderReportsService.ts
import { apiClient } from './apiClient';

export interface OrderReportRow {
  date: string;
  orderCount: number;
  totalCost: number;
  revenueWithoutShipping: number;
  totalRevenue: number;
  shippingFees: number;
  costPercentage: number;
  currency: string;
}

export interface OrdersReportResponse {
  daily: OrderReportRow[];
  monthly: OrderReportRow[];
}

export type EshopChannel = 'CZ-ESHOP' | 'SK-ESHOP' | 'HU-ESHOP';

interface RawOrder {
  id: string;
  createdAt: string;
  priceWithVat: number;
  priceWithoutVat?: number;
  currency: string;
  channel?: string;
  carrierId?: string;
  carrierName?: string;
}

export const orderReportsService = {
  /**
   * Načte agregované reporty objednávek pro daný e-shop
   * @param channel - Kanál e-shopu (CZ-ESHOP, SK-ESHOP, HU-ESHOP)
   * @param period - Období (daily, monthly)
   * @param daysBack - Počet dní zpět pro načtení dat
   */
  async getOrdersReport(
    channel: EshopChannel,
    period: 'daily' | 'monthly' = 'daily',
    daysBack: number = 30
  ): Promise<OrderReportRow[]> {
    // Vypočítej datum od kdy načítat data
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);
    const dateFromStr = dateFrom.toISOString().split('T')[0];

    // Sestavit query parametry
    const queryParams = new URLSearchParams({
      maxSize: '1000',
      offset: '0',
      orderBy: 'createdAt',
      order: 'desc',
      attributeSelect: 'createdAt,priceWithVat,priceWithoutVat,currency,channel,carrierId,carrierName',
    });

    // Filtr pro kanál
    queryParams.append('whereGroup[0][type]', 'equals');
    queryParams.append('whereGroup[0][attribute]', 'channel');
    queryParams.append('whereGroup[0][value]', channel);

    // Filtr pro datum
    queryParams.append('whereGroup[1][type]', 'after');
    queryParams.append('whereGroup[1][attribute]', 'createdAt');
    queryParams.append('whereGroup[1][value]', dateFromStr);

    console.log('📊 Fetching orders report:', channel, period, queryParams.toString());

    try {
      const response = await apiClient.get<{ total: number; list: RawOrder[] }>(
        `/SalesOrder?${queryParams}`
      );

      console.log('📊 Orders fetched:', response.total);

      // Agregovat data podle periody
      return this.aggregateOrders(response.list, period);
    } catch (error) {
      console.error('❌ Error fetching orders report:', error);
      throw error;
    }
  },

  /**
   * Načte reporty pro všechny e-shopy najednou (paralelně)
   */
  async getAllShopsReports(
    period: 'daily' | 'monthly' = 'daily',
    daysBack: number = 30
  ): Promise<Record<EshopChannel, OrderReportRow[]>> {
    const channels: EshopChannel[] = ['CZ-ESHOP', 'SK-ESHOP', 'HU-ESHOP'];

    console.log('📊 Fetching all shops reports in parallel...');

    // Načíst všechny reporty paralelně
    const promises = channels.map((channel) =>
      this.getOrdersReport(channel, period, daysBack).catch((error) => {
        console.error(`❌ Error fetching ${channel}:`, error);
        return [] as OrderReportRow[]; // Vrátit prázdné pole v případě chyby
      })
    );

    const results = await Promise.all(promises);

    return {
      'CZ-ESHOP': results[0],
      'SK-ESHOP': results[1],
      'HU-ESHOP': results[2],
    };
  },

  /**
   * Agreguje objednávky podle periody (denně nebo měsíčně)
   */
  aggregateOrders(orders: RawOrder[], period: 'daily' | 'monthly'): OrderReportRow[] {
    // Skupiny podle data
    const groups = new Map<string, RawOrder[]>();

    orders.forEach((order) => {
      // Formátuj datum podle periody
      const date = new Date(order.createdAt);
      let key: string;

      if (period === 'monthly') {
        // Formát: YYYY-MM
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Formát: YYYY-MM-DD
        key = date.toISOString().split('T')[0];
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    });

    // Převést skupiny na reportové řádky
    const rows: OrderReportRow[] = [];

    groups.forEach((ordersInGroup, dateKey) => {
      const orderCount = ordersInGroup.length;

      // Celková tržba s DPH
      const totalRevenue = ordersInGroup.reduce((sum, o) => sum + (o.priceWithVat || 0), 0);

      // Celková tržba bez DPH
      const totalRevenueWithoutVat = ordersInGroup.reduce(
        (sum, o) => sum + (o.priceWithoutVat || o.priceWithVat || 0),
        0
      );

      // Pro zjednodušení - náklady odhadneme jako 60% z tržby bez DPH
      // V realitě by se to mělo načítat z nákladových dat
      const totalCost = totalRevenueWithoutVat * 0.6;

      // Poplatky za dopravu - odhadneme průměrně 100 Kč per objednávka
      // V realitě by se mělo načítat z dat objednávek
      const shippingFees = orderCount * 100;

      // Tržba bez dopravy
      const revenueWithoutShipping = totalRevenue - shippingFees;

      // Procento nákladů
      const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

      // Určit měnu (vezmi první nenulovou)
      const currency = ordersInGroup.find((o) => o.currency)?.currency || 'CZK';

      rows.push({
        date: dateKey,
        orderCount,
        totalCost: Math.round(totalCost * 100) / 100,
        revenueWithoutShipping: Math.round(revenueWithoutShipping * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        shippingFees: Math.round(shippingFees * 100) / 100,
        costPercentage: Math.round(costPercentage * 100) / 100,
        currency,
      });
    });

    // Seřadit podle data sestupně (nejnovější nahoře)
    rows.sort((a, b) => b.date.localeCompare(a.date));

    return rows;
  },

  /**
   * Formátuje číslo jako měnu
   */
  formatCurrency(value: number, currency: string = 'CZK'): string {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Formátuje datum do lidsky čitelné podoby
   */
  formatDate(dateStr: string, period: 'daily' | 'monthly'): string {
    if (period === 'monthly') {
      // Formát: Leden 2025
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' });
    } else {
      // Formát: 1. 12. 2025
      const date = new Date(dateStr);
      return date.toLocaleDateString('cs-CZ');
    }
  },
};
