import {
  AlignLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Circle,
  Compass,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  Presentation,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from 'lucide-react';

/**
 * Resolves an icon *name* to a component.
 *
 * The domain layer stores icon names as strings so that it stays free of React.
 * This map is the single place where those names become components, which also
 * means the icon library is only pulled into the client bundle from here rather
 * than being imported by every module that mentions a section.
 */
const ICONS: Record<string, LucideIcon> = {
  AlignLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Compass,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Presentation,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
};

export interface IconProps {
  /** Name from the domain layer, e.g. `SECTION_DEFINITIONS[n].icon`. */
  name: string;
  className?: string;
  size?: number;
}

/**
 * Renders an icon, always `aria-hidden`.
 *
 * Icons in this app are decorative by construction: every one of them sits next
 * to a text label. If an icon ever needs to carry meaning on its own, that
 * meaning belongs in a visually-hidden span at the call site, not here.
 */
export function Icon({ name, className, size = 18 }: IconProps) {
  const Component = ICONS[name] ?? Circle;

  return <Component aria-hidden="true" size={size} className={className} />;
}
