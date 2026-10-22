'use client';

import { Button } from '@neevpass/ui';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

/**
 * The documentElement's `dark` class is applied by the inline boot script
 * before first paint. The toggle reads that class after mount rather than
 * during render: the server cannot know the theme, and reading it on the first
 * client render would produce a hydration mismatch.
 *
 * The placeholder on the server has the same footprint as the icon, so the
 * header does not shift when hydration completes.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // The boot script has already applied the stored theme to <html>; reading it
    // after mount is the only way to avoid guessing on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';

    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    setTheme(next);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Best effort: a user in a restricted privacy mode still gets a working
      // toggle for the current page.
    }
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
