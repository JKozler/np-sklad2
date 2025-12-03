// src/layouts/full/vertical-sidebar/sidebarItem.ts
import {
  CircleIcon,
  DashboardIcon,
  ShoppingCartIcon,
  PackageIcon,
  ChartBarIcon,
  SettingsIcon,
  BrandProducthuntIcon,
  BuildingWarehouseIcon,
  TruckDeliveryIcon,
  TruckLoadingIcon
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
  requiredDashboards?: string[];
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
    title: 'Expedice',
    icon: TruckDeliveryIcon,
    to: 'https://smart-int-be.naturalprotein.net/?entryPoint=expeditionPortal',
    type: 'external',
    requiredDashboards: ['WAREHOUSE_MANAGER']
  },
  {
    title: 'Výroba',
    icon: TruckLoadingIcon,
    to: 'https://crm.naturalprotein.cz/?entryPoint=productionPortal',
    type: 'external',
    requiredDashboards: ['WAREHOUSE_MANAGER']
  },
  {
    title: 'Balíky',
    icon: PackageIcon,
    to: '/packages'
  },
  
  /*{ divider: true },
  { header: 'Statistiky' },
  {
    title: 'Reporty',
    icon: ChartBarIcon,
    to: '/reports'
  },*/
  
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
  to: '/inventory-transactions',
  requiredDashboards: ['WAREHOUSE_MANAGER']
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
  requiredDashboards: ['WAREHOUSE_MANAGER'],
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