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