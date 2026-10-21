import { SECTION_DEFINITIONS, type SectionKind } from '@neevpass/domain';

/**
 * Navigation model.
 *
 * Declared as data so the sidebar, the mobile drawer and the command palette
 * (later) all render from one source. `icon` is a name resolved by
 * `<Icon />`, because this module is imported by server components and must not
 * pull the icon library into the server bundle.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  /** Short description used by the mobile drawer and, later, search. */
  readonly description?: string;
  /** Marks a route that exists but is not built yet. Rendered as unavailable. */
  readonly comingSoon?: boolean;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    description: 'Your profile at a glance',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: 'User',
    description: 'Everything you have done, in one place',
  },
  {
    label: 'Resumes',
    href: '/resumes',
    icon: 'FileText',
    description: 'Build and export resumes',
    comingSoon: true,
  },
  {
    label: 'Portfolio',
    href: '/portfolios',
    icon: 'Globe',
    description: 'Publish an online portfolio',
    comingSoon: true,
  },
  {
    label: 'Career',
    href: '/career',
    icon: 'Target',
    description: 'Score, goals and skill gaps',
    comingSoon: true,
  },
  {
    label: 'Opportunities',
    href: '/opportunities',
    icon: 'Compass',
    description: 'Internships, competitions and workshops',
    comingSoon: true,
  },
];

export const SECONDARY_NAV: readonly NavItem[] = [
  {
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
    description: 'Account and privacy',
  },
];

export interface ProfileNavItem extends NavItem {
  readonly kind: SectionKind;
}

/**
 * The profile section sub-navigation, derived from the domain's single source
 * of truth for sections. Adding a section there makes it appear here
 * automatically.
 */
export const PROFILE_NAV: readonly ProfileNavItem[] = SECTION_DEFINITIONS.map((section) => ({
  kind: section.kind,
  label: section.label,
  href: `/profile/${section.slug}`,
  icon: section.icon,
  description: section.description,
  comingSoon: true,
}));

/**
 * True when `href` should be rendered as the active item.
 *
 * `/dashboard` must not match `/dashboard/anything` unless it really is a
 * child route, so the comparison is segment-aware rather than a prefix match.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
