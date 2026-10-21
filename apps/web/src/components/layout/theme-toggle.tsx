'use client';

import { Button } from '@neevpass/ui';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

/**
 * The documentElement's `dark` class is an external store: the inline boot
 * script writes it before hydration, and the toggle writes it on click.
 *
 * `useSyncExternalStore` subscribes React to that class without chasing it
 * with effects. The server snapshot is `null` — the theme class is unknown at
 * render time without causing a hydration mismatch — so the server-rendered
 * markup is the neutral placeholder, and hydration swaps in the real value.
 */
const MUTATED_ATTRIBUTES: MutationObserverInit = { attributes: true, attributeFilter: ['class'] };

function subscribeToThemeClass(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, MUTATED_ATTRIBUTES);
  return () => observer.disconnect();
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getThemeServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemeClass, getThemeSnapshot, getThemeServerSnapshot);

  function toggle() {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';

    // Mutating the external store is enough: the subscription notifies React
    // and the snapshot change re-renders the toggle.
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;

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
