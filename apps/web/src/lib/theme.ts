/**
 * Theme constants.
 *
 * Server-safe: this module is imported by the root layout, so it must not touch
 * `document` or `localStorage`. The browser-side helpers live in
 * `components/layout/theme-toggle.tsx`, which is a client component.
 *
 * WHY A CLASS INSTEAD OF A MEDIA QUERY
 * ------------------------------------
 * A user should be able to override their OS preference and have it stick. That
 * creates a problem: the server renders HTML before any JavaScript runs, so it
 * cannot know which class to emit, and a wrong guess shows a flash of the wrong
 * theme.
 *
 * The fix is `THEME_INIT_SCRIPT`, inlined into `<head>` ahead of the app. It
 * runs synchronously before first paint, reads the stored preference (falling
 * back to the OS setting) and applies the class. Nothing is ever painted in the
 * wrong theme, and no cookie or server round-trip is needed.
 */

export const THEME_STORAGE_KEY = 'neevpass-theme';

export type Theme = 'light' | 'dark';

/**
 * Static, self-contained, evaluated before paint.
 *
 * Wrapped in try/catch because `localStorage` throws in some privacy modes — a
 * failure here must degrade to the OS preference, never break the page.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var k='${THEME_STORAGE_KEY}';
var s=localStorage.getItem(k);
var d=s==='dark'||(s===null&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark',d);
document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;
