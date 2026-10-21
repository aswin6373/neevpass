/**
 * @neevpass/ui — the NeevPass design system.
 *
 * Components here are presentational and carry no application state. They read
 * their colours from the CSS custom properties defined in
 * `./styles/tokens.css`, which the web app maps into Tailwind's theme, so a
 * component never hard-codes a hex value.
 */

export { cn } from './lib/cn';

export { Alert, type AlertProps } from './components/alert';
export { Badge, type BadgeProps } from './components/badge';
export { Button, buttonVariants, type ButtonProps } from './components/button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardTitleProps,
} from './components/card';
export { EmptyState, type EmptyStateProps } from './components/empty-state';
export { Field, type FieldControlProps, type FieldProps } from './components/field';
export { Input, type InputProps } from './components/input';
export { Label, type LabelProps } from './components/label';
export { PageHeader, type PageHeaderProps } from './components/page-header';
export { SelfReportedNotice, type SelfReportedNoticeProps } from './components/self-reported-notice';
export { Separator, type SeparatorProps } from './components/separator';
export { Skeleton, type SkeletonProps } from './components/skeleton';
export { Spinner, type SpinnerProps, type SpinnerSize } from './components/spinner';
export { Textarea, type TextareaProps } from './components/textarea';
export { VisuallyHidden, type VisuallyHiddenProps } from './components/visually-hidden';
