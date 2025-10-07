// src/services/productsService.ts
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
  
  const MOCK_PRODUCTS: Product[] = [
    { id: 1, name: '3x Maca 60 cps', monthlyConsumption: 195.33, minStock: 300, totalQuantity: 572, costPrice: 80.90, totalStockPrice: 46274.80, category: 'Doplňky', supplier: 'Dodavatel A', sku: 'MACA-001' },
    { id: 2, name: 'ACAI 70g', monthlyConsumption: 45, minStock: 20, totalQuantity: 123, costPrice: 105.69, totalStockPrice: 13000.21, category: 'Superfoods', supplier: 'Dodavatel B', sku: 'ACAI-001' },
    { id: 3, name: 'Acerola 60 kapslí', monthlyConsumption: 188.17, minStock: 300, totalQuantity: 381, costPrice: 62.00, totalStockPrice: 23622.00, category: 'Doplňky', supplier: 'Dodavatel A', sku: 'ACER-001' },
    { id: 4, name: 'ALFA ALFA 60g', monthlyConsumption: 36.17, minStock: 20, totalQuantity: 156, costPrice: 20.94, totalStockPrice: 3267.08, category: 'Superfoods', supplier: 'Dodavatel C', sku: 'ALFA-001' },
    { id: 5, name: 'Arašídové máslo v prášku 200g', monthlyConsumption: 64.33, minStock: 30, totalQuantity: 66, costPrice: 151.30, totalStockPrice: 9985.80, category: 'Proteiny', supplier: 'Dodavatel B', sku: 'ARAS-001' },
    { id: 6, name: 'ASHWAGANDHA 100g', monthlyConsumption: 139, minStock: 40, totalQuantity: 93, costPrice: 34.65, totalStockPrice: 3222.45, category: 'Adaptogeny', supplier: 'Dodavatel A', sku: 'ASHW-001' },
    { id: 7, name: 'Ashwagandha 60cps', monthlyConsumption: 139.17, minStock: 200, totalQuantity: 545, costPrice: 91.10, totalStockPrice: 49649.50, category: 'Adaptogeny', supplier: 'Dodavatel A', sku: 'ASHW-002' },
    { id: 8, name: 'BCAA a Kreatin Malina 300g', monthlyConsumption: 89.83, minStock: 40, totalQuantity: 248, costPrice: 161.34, totalStockPrice: 40012.01, category: 'Sport', supplier: 'Dodavatel D', sku: 'BCAA-001' },
    { id: 9, name: 'BCAA a Kreatin Maracuja 300g', monthlyConsumption: 58, minStock: 40, totalQuantity: 235, costPrice: 174.30, totalStockPrice: 40961.44, category: 'Sport', supplier: 'Dodavatel D', sku: 'BCAA-002' },
    { id: 10, name: 'Bezlaktózový protein 350g', monthlyConsumption: 330.33, minStock: 40, totalQuantity: 101, costPrice: 113.33, totalStockPrice: 11446.00, category: 'Proteiny', supplier: 'Dodavatel B', sku: 'PROT-001' },
    { id: 11, name: 'Bezlaktózový protein Banán 350g', monthlyConsumption: 96, minStock: 40, totalQuantity: 24, costPrice: 117.43, totalStockPrice: 2818.29, category: 'Proteiny', supplier: 'Dodavatel B', sku: 'PROT-002' },
    { id: 12, name: 'Bezlaktózový protein Jahoda 350g', monthlyConsumption: 136.17, minStock: 40, totalQuantity: 67, costPrice: 130.04, totalStockPrice: 8712.68, category: 'Proteiny', supplier: 'Dodavatel B', sku: 'PROT-003' },
    { id: 13, name: 'Bezlaktózový protein Kakao 350g', monthlyConsumption: 131.83, minStock: 40, totalQuantity: 69, costPrice: 108.87, totalStockPrice: 7512.06, category: 'Proteiny', supplier: 'Dodavatel B', sku: 'PROT-004' },
    { id: 14, name: 'Bezlaktózový protein Kokos 350g', monthlyConsumption: 52.17, minStock: 40, totalQuantity: 84, costPrice: 101.80, totalStockPrice: 8551.07, category: 'Proteiny', supplier: 'Dodavatel B', sku: 'PROT-005' },
    { id: 15, name: 'Chia semínka 250g', monthlyConsumption: 75.5, minStock: 50, totalQuantity: 180, costPrice: 45.90, totalStockPrice: 8262.00, category: 'Superfoods', supplier: 'Dodavatel C', sku: 'CHIA-001' }
  ];
  
  export const productsService = {
    async getAll(filters?: ProductFilters): Promise<Product[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
  
      let filtered = [...MOCK_PRODUCTS];
  
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
        );
      }
  
      if (filters?.category) {
        filtered = filtered.filter(p => p.category === filters.category);
      }
  
      if (filters?.supplier) {
        filtered = filtered.filter(p => p.supplier === filters.supplier);
      }
  
      if (filters?.lowStock) {
        filtered = filtered.filter(p => p.totalQuantity < p.minStock);
      }
  
      return filtered;
    },
  
    async getById(id: number): Promise<Product | null> {
      await new Promise(resolve => setTimeout(resolve, 200));
      return MOCK_PRODUCTS.find(p => p.id === id) || null;
    },
  
    async create(data: CreateProductData): Promise<Product> {
      await new Promise(resolve => setTimeout(resolve, 400));
  
      const newProduct: Product = {
        id: MOCK_PRODUCTS.length + 1,
        ...data,
        totalStockPrice: data.totalQuantity * data.costPrice
      };
  
      MOCK_PRODUCTS.push(newProduct);
      return newProduct;
    },
  
    async update(id: number, data: Partial<Product>): Promise<Product> {
      await new Promise(resolve => setTimeout(resolve, 400));
  
      const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Produkt nenalezen');
  
      MOCK_PRODUCTS[index] = { 
        ...MOCK_PRODUCTS[index], 
        ...data,
        totalStockPrice: (data.totalQuantity || MOCK_PRODUCTS[index].totalQuantity) * 
                         (data.costPrice || MOCK_PRODUCTS[index].costPrice)
      };
  
      return MOCK_PRODUCTS[index];
    },
  
    async delete(id: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_PRODUCTS.splice(index, 1);
      }
    },
  
    async getCategories(): Promise<string[]> {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...new Set(MOCK_PRODUCTS.map(p => p.category).filter(Boolean) as string[])];
    },
  
    async getSuppliers(): Promise<string[]> {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...new Set(MOCK_PRODUCTS.map(p => p.supplier).filter(Boolean) as string[])];
    }
  };