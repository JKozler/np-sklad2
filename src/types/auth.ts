// src/types/auth.ts
export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
    token: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
  
  // src/types/product.ts
  export interface Product {
    id: number;
    name: string;
    monthlyConsumption: number;
    minStock: number;
    totalQuantity: number;
    costPrice: number;
    totalStockPrice: number;
    category?: string;
    supplier?: string;
    sku?: string;
  }
  
  export interface ProductFilters {
    search?: string;
    category?: string;
    supplier?: string;
    lowStock?: boolean;
  }
  
  export interface CreateProductData {
    name: string;
    monthlyConsumption: number;
    minStock: number;
    totalQuantity: number;
    costPrice: number;
    category?: string;
    supplier?: string;
    sku?: string;
  }
  
  // src/types/customer.ts
  export interface Customer {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string | null;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    notes?: string | null;
    createdAt?: string;
  }
  
  export interface CreateCustomerData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
  }
  
  // src/types/order.ts
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
  
  // src/types/supplier.ts
  export interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    createdAt?: string;
  }
  
  export interface CreateSupplierData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  }