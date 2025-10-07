import {
  CircleIcon,
  WindmillIcon,
  TypographyIcon,
  ShadowIcon,
  PaletteIcon,
  KeyIcon,
  BugIcon,
  DashboardIcon,
  BrandChromeIcon,
  HelpIcon,
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
    title: 'Default',
    icon: DashboardIcon,
    to: '/dashboard/default'
  },
  { divider: true },
  { header: 'Pages' },
  {
    title: 'Authentication',
    icon: KeyIcon,
    to: '/auth',
    children: [
      {
        title: 'Login',
        icon: CircleIcon,
        to: '/login1'
      },
      {
        title: 'Register',
        icon: CircleIcon,
        to: '/register'
      }
    ]
  },
  {
    title: 'Error 404',
    icon: BugIcon,
    to: '/error'
  },
  { divider: true },
  { header: 'Nákup a sklad' },
  {
    title: 'Produkty',
    icon: BrandProducthuntIcon,
    to: '/utils/products'
  },
  /*{
    title: 'Typography',
    icon: TypographyIcon,
    to: '/utils/typography'
  },
  {
    title: 'Shadows',
    icon: ShadowIcon,
    to: '/utils/shadows'
  },
  {
    title: 'Colors',
    icon: PaletteIcon,
    to: '/utils/colors'
  },

  {
    title: 'Icons',
    icon: WindmillIcon,
    to: '/forms/radio',
    children: [
      {
        title: 'Tabler Icons',
        icon: CircleIcon,
        to: '/icons/tabler'
      },
      {
        title: 'Material Icons',
        icon: CircleIcon,
        to: '/icons/material'
      }
    ]
  },*/
  { divider: true }
];

export default sidebarItem;
