// src/services/customersService.ts
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
  
  const MOCK_CUSTOMERS: Customer[] = [
    { 
      id: 1, 
      firstName: 'Jan', 
      lastName: 'Novák', 
      email: 'jan.novak@email.cz', 
      phone: '+420 777 123 456', 
      company: 'Fit Studio Praha',
      address: 'Václavské náměstí 1',
      city: 'Praha',
      postalCode: '110 00',
      country: 'CZ',
      notes: 'VIP zákazník, preferuje expresní dodání',
      createdAt: '2024-01-15'
    },
    { 
      id: 2, 
      firstName: 'Marie', 
      lastName: 'Svobodová', 
      email: 'marie.svobodova@email.cz', 
      phone: '+420 606 987 654',
      company: null,
      address: 'Dlouhá 15',
      city: 'Brno',
      postalCode: '602 00',
      country: 'CZ',
      notes: 'Pravidelný zákazník',
      createdAt: '2024-02-20'
    },
    { 
      id: 3, 
      firstName: 'Petr', 
      lastName: 'Dvořák', 
      email: 'petr.dvorak@firma.cz', 
      phone: '+420 723 456 789',
      company: 'SportZone s.r.o.',
      address: 'Sportovní 88',
      city: 'Ostrava',
      postalCode: '708 00',
      country: 'CZ',
      notes: 'Velkoobchodní zákazník',
      createdAt: '2023-11-05'
    },
    { 
      id: 4, 
      firstName: 'Eva', 
      lastName: 'Černá', 
      email: 'eva.cerna@email.cz', 
      phone: '+420 774 111 222',
      company: null,
      address: 'Nová 42',
      city: 'Plzeň',
      postalCode: '301 00',
      country: 'CZ',
      notes: null,
      createdAt: '2024-03-12'
    },
    { 
      id: 5, 
      firstName: 'Tomáš', 
      lastName: 'Procházka', 
      email: 'tomas.prochazka@healthclub.cz', 
      phone: '+420 603 555 888',
      company: 'Health Club Liberec',
      address: 'Fitness 7',
      city: 'Liberec',
      postalCode: '460 01',
      country: 'CZ',
      notes: 'Měsíční odběr proteinů',
      createdAt: '2023-09-28'
    }
  ];
  
  export const customersService = {
    async getAll(search?: string): Promise<Customer[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
  
      if (!search) return [...MOCK_CUSTOMERS];
  
      const searchLower = search.toLowerCase();
      return MOCK_CUSTOMERS.filter(c => 
        c.firstName.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower)
      );
    },
  
    async getById(id: number): Promise<Customer | null> {
      await new Promise(resolve => setTimeout(resolve, 200));
      return MOCK_CUSTOMERS.find(c => c.id === id) || null;
    },
  
    async create(data: CreateCustomerData): Promise<Customer> {
      await new Promise(resolve => setTimeout(resolve, 400));
  
      const newCustomer: Customer = {
        id: MOCK_CUSTOMERS.length + 1,
        ...data,
        createdAt: new Date().toISOString().split('T')[0]
      };
  
      MOCK_CUSTOMERS.push(newCustomer);
      return newCustomer;
    },
  
    async update(id: number, data: Partial<Customer>): Promise<Customer> {
      await new Promise(resolve => setTimeout(resolve, 400));
  
      const index = MOCK_CUSTOMERS.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Zákazník nenalezen');
  
      MOCK_CUSTOMERS[index] = { ...MOCK_CUSTOMERS[index], ...data };
      return MOCK_CUSTOMERS[index];
    },
  
    async delete(id: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = MOCK_CUSTOMERS.findIndex(c => c.id === id);
      if (index !== -1) {
        MOCK_CUSTOMERS.splice(index, 1);
      }
    },
  
    async getStats(): Promise<{ total: number; newThisMonth: number; companies: number }> {
      await new Promise(resolve => setTimeout(resolve, 200));
  
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
      return {
        total: MOCK_CUSTOMERS.length,
        newThisMonth: MOCK_CUSTOMERS.filter(c => c.createdAt?.startsWith(thisMonth)).length,
        companies: MOCK_CUSTOMERS.filter(c => c.company).length
      };
    }
  };