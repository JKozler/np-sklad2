// src/layouts/full/vertical-sidebar/sidebarItem.ts
import {
  CircleIcon,
  DashboardIcon,
  ShoppingCartIcon,
  UsersIcon,
  PackageIcon,
  FileInvoiceIcon,
  TruckDeliveryIcon,
  ChartBarIcon,
  SettingsIcon,
  BrandProducthuntIcon
} from 'vue-tabler-icons';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  { header: 'Dashboard' },
  {
    title: 'Přehled',
    icon: DashboardIcon,
    to: '/dashboard/default'
  },
  
  { divider: true },
  { header: 'Obchod' },
  {
    title: 'Objednávky',
    icon: ShoppingCartIcon,
    to: '/orders'
  },
  {
    title: 'Zákazníci',
    icon: UsersIcon,
    to: '/customers'
  },
  {
    title: 'Faktury',
    icon: FileInvoiceIcon,
    to: '/invoices'
  },
  
  { divider: true },
  { header: 'Sklad' },
  {
    title: 'Produkty',
    icon: BrandProducthuntIcon,
    to: '/products'
  },
  {
    title: 'Nákupní žádosti',
    icon: PackageIcon,
    to: '/purchase-requests'
  },
  {
    title: 'Dodavatelé',
    icon: TruckDeliveryIcon,
    to: '/suppliers'
  },
  
  { divider: true },
  { header: 'Statistiky' },
  {
    title: 'Reporty',
    icon: ChartBarIcon,
    to: '/reports'
  },
  
  { divider: true },
  { header: 'Nastavení' },
  {
    title: 'Systém',
    icon: SettingsIcon,
    to: '/settings',
    children: [
      {
        title: 'Uživatelé',
        icon: CircleIcon,
        to: '/settings/users'
      },
      {
        title: 'Obecné',
        icon: CircleIcon,
        to: '/settings/general'
      }
    ]
  }
];

export default sidebarItem;