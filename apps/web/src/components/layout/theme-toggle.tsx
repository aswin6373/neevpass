'use client';

import { Button } from '@neevpass/ui';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

/**
 * Light/dark toggle.
 *
 * The initial state is `null` on purpose. The theme class is applied by an
 * inline script before React hydrates, so React cannot know the value during
 * the server render without causing a hydration mismatch. Rendering a neutral
 * placeholder until mount keeps the markup identical on both sides.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';

    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Best effort: a user in a restricted privacy mode still gets a working
      // toggle for the current page.
    }

    setTheme(next);
  }

  const label =
    theme === null
      ? 'Switch theme'
      : theme === 'dark'
        ? 'Switch to light theme'
        : 'Switch to dark theme';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
      // The icon is decorative; the accessible name is on the button.
    >
      {theme === 'dark' ? (
        <Sun size={18} aria-hidden="true" />
      ) : theme === 'light' ? (
        <Moon size={18} aria-hidden="true" />
      ) : (
        // Same footprint as an icon, so the button does not resize on mount.
        <span className="block h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </Button>
  );
}
