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
  TruckLoadingIcon,
  ClipboardListIcon,
  TruckIcon
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
    to: 'https://smart-be.naturalprotein.net/?entryPoint=expeditionPortal',
    type: 'external',
    requiredDashboards: ['WAREHOUSE_MANAGER']
  },
  {
    title: 'Výroba',
    icon: TruckLoadingIcon,
    to: 'https://smart-be.naturalprotein.net/?entryPoint=productionPortal',
    type: 'external',
    requiredDashboards: ['WAREHOUSE_MANAGER']
  },
  {
    title: 'Výrobní příkazy',
    icon: ClipboardListIcon,
    to: '/production-orders',
    requiredDashboards: ['WAREHOUSE_MANAGER']
  },
  {
    title: 'Balíky',
    icon: PackageIcon,
    to: '/packages'
  },
  {
    title: 'Dodavatelé',
    icon: PackageIcon,
    to: '/suppliers',
    requiredDashboards: ['WAREHOUSE_MANAGER']
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
  title: 'Příjemky',
  icon: TruckLoadingIcon,
  to: '/prijemky',
  requiredDashboards: ['WAREHOUSE_MANAGER']
},
{
  title: 'Výdejky',
  icon: TruckDeliveryIcon,
  to: '/vydejky',
  requiredDashboards: ['WAREHOUSE_MANAGER']
},
{
  title: 'Dopravci',
  icon: TruckIcon,
  to: '/carriers',
  requiredDashboards: ['WAREHOUSE_MANAGER']
},
{
  title: 'Nákupní žádosti',
  icon: ClipboardListIcon,
  to: '/purchase-requests',
  requiredDashboards: ['WAREHOUSE_MANAGER']
},
{
  title: 'Sklady',
  icon: BuildingWarehouseIcon,
  to: '/warehouses',
  requiredDashboards: ['WAREHOUSE_MANAGER']
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