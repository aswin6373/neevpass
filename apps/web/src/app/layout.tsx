import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@neevpass/domain';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { publicEnv } from '@/lib/env';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  // Public career pages are meant to be found; the private app is not. Pages
  // that should be indexed opt in individually.
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Matches the token values so the browser chrome does not flash white in
  // dark mode on mobile.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf6' },
    { media: '(prefers-color-scheme: dark)', color: '#071726' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `suppressHydrationWarning` is required because THEME_INIT_SCRIPT adds the
    // `dark` class to this element before React hydrates. It is scoped to this
    // element and its attributes — it does not suppress warnings in children.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs synchronously before first paint so the correct theme is
            applied without a flash of the wrong one. The content is a static
            constant, never user input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-content antialiased">
        {children}
      </body>
    </html>
  );
}
