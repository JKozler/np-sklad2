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
  BrandProducthuntIcon,
  BuildingWarehouseIcon
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
  
  { divider: true },
  { header: 'Statistiky' },
  {
    title: 'Reporty',
    icon: ChartBarIcon,
    to: '/reports'
  },
  
  { divider: true },
{ header: 'Sklad' },
{
  title: 'Produkty',
  icon: BrandProducthuntIcon,
  to: '/products'
},
{
  title: 'Skladové pohyby',
  icon: PackageIcon,
  to: '/inventory-transactions'
},
{
  title: 'Sklady',
  icon: BuildingWarehouseIcon,
  to: '/warehouses'
},
{
  title: 'Systém',
  icon: SettingsIcon,
  to: '/settings',
  children: [
    {
      title: 'Synchronizace Abra',
      icon: CircleIcon,
      to: '/settings/sync'
    }
  ]
}
];

export default sidebarItem;