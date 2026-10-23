import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@neevpass/domain';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { publicEnv } from '@/lib/env';

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
  // The workspace is dark-only, so browser chrome and native controls match it.
  colorScheme: 'dark',
  themeColor: '#071726',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-content antialiased">
        {children}
      </body>
    </html>
  );
}
