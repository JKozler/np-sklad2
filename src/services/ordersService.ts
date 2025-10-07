// src/services/ordersService.ts
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  customerId: number;
  customerName: string;
  items: OrderItem[];
  notes?: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    orderNumber: 'ORD-2024-0001',
    customerId: 1,
    customerName: 'Jan Novák',
    status: 'completed',
    totalAmount: 4850.50,
    items: [
      { productId: 1, productName: '3x Maca 60 cps', quantity: 10, price: 80.90 },
      { productId: 3, productName: 'Acerola 60 kapslí', quantity: 50, price: 62.00 }
    ],
    notes: 'Prosím o rychlé dodání',
    createdAt: '2024-10-01',
    updatedAt: '2024-10-02'
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-0002',
    customerId: 3,
    customerName: 'Petr Dvořák',
    status: 'processing',
    totalAmount: 12450.00,
    items: [
      { productId: 10, productName: 'Bezlaktózový protein 350g', quantity: 100, price: 113.33 },
      { productId: 8, productName: 'BCAA a Kreatin Malina 300g', quantity: 20, price: 161.34 }
    ],
    notes: 'Velkoobchodní objednávka',
    createdAt: '2024-10-05',
    updatedAt: '2024-10-05'
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-0003',
    customerId: 2,
    customerName: 'Marie Svobodová',
    status: 'pending',
    totalAmount: 2340.00,
    items: [
      { productId: 7, productName: 'Ashwagandha 60cps', quantity: 20, price: 91.10 },
      { productId: 4, productName: 'ALFA ALFA 60g', quantity: 30, price: 20.94 }
    ],
    notes: null,
    createdAt: '2024-10-07',
    updatedAt: '2024-10-07'
  },
  {
    id: 4,
    orderNumber: 'ORD-2024-0004',
    customerId: 5,
    customerName: 'Tomáš Procházka',
    status: 'shipped',
    totalAmount: 8920.00,
    items: [
      { productId: 10, productName: 'Bezlaktózový protein 350g', quantity: 50, price: 113.33 },
      { productId: 11, productName: 'Bezlaktózový protein Banán 350g', quantity: 30, price: 117.43 }
    ],
    notes: 'Měsíční dodávka',
    createdAt: '2024-10-03',
    updatedAt: '2024-10-06'
  },
  {
    id: 5,
    orderNumber: 'ORD-2024-0005',
    customerId: 4,
    customerName: 'Eva Černá',
    status: 'cancelled',
    totalAmount: 1580.00,
    items: [
      { productId: 2, productName: 'ACAI 70g', quantity: 15, price: 105.69 }
    ],
    notes: 'Zákazník zrušil objednávku',
    createdAt: '2024-09-28',
    updatedAt: '2024-09-29'
  }
];

export const ordersService = {
  async getAll(filters?: { status?: OrderStatus; customerId?: number }): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...MOCK_ORDERS];

    if (filters?.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    if (filters?.customerId) {
      filtered = filtered.filter(o => o.customerId === filters.customerId);
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getById(id: number): Promise<Order | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_ORDERS.find(o => o.id === id) || null;
  },

  async create(data: CreateOrderData): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(MOCK_ORDERS.length + 1).padStart(4, '0')}`;
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const newOrder: Order = {
      id: MOCK_ORDERS.length + 1,
      orderNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      status: 'pending',
      totalAmount,
      items: data.items,
      notes: data.notes || null,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    MOCK_ORDERS.push(newOrder);
    return newOrder;
  },

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = MOCK_ORDERS.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Objednávka nenalezena');

    MOCK_ORDERS[index] = { 
      ...MOCK_ORDERS[index], 
      status,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return MOCK_ORDERS[index];
  },

  async delete(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_ORDERS.findIndex(o => o.id === id);
    if (index !== -1) {
      MOCK_ORDERS.splice(index, 1);
    }
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      total: MOCK_ORDERS.length,
      pending: MOCK_ORDERS.filter(o => o.status === 'pending').length,
      processing: MOCK_ORDERS.filter(o => o.status === 'processing').length,
      shipped: MOCK_ORDERS.filter(o => o.status === 'shipped').length,
      completed: MOCK_ORDERS.filter(o => o.status === 'completed').length,
      cancelled: MOCK_ORDERS.filter(o => o.status === 'cancelled').length,
      totalRevenue: MOCK_ORDERS
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }
};