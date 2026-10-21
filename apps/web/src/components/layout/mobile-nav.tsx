'use client';

import { Button } from '@neevpass/ui';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { SidebarNav } from './sidebar';

/**
 * Mobile navigation drawer.
 *
 * Deliberately hand-rolled rather than pulled from a dialog library: it is
 * small, and getting the behaviour right matters more than the abstraction.
 *
 * What "right" means here:
 *   - Escape closes the drawer and returns focus to the trigger, so a keyboard
 *     user is never stranded.
 *   - Background scrolling is locked while open, so the page behind does not
 *     move under the user's finger.
 *   - Focus moves into the panel on open.
 *   - The trigger reports its state with `aria-expanded` and points at the
 *     panel with `aria-controls`.
 *
 * The desktop sidebar is rendered separately and is always visible at `lg` and
 * above, so this component is hidden there — it is never two navigations at
 * once for a screen reader.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} aria-hidden="true" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Clicking the scrim closes the drawer. It is aria-hidden because it
              is a redundant way to do what the Escape key and the close button
              already do. */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-nav-panel"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-line bg-surface p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-content">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
