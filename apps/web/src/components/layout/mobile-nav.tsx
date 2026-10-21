'use client';

import { Button } from '@neevpass/ui';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { MobileNavList } from './sidebar';

/**
 * Mobile navigation drawer.
 *
 * The behaviour is the same as any well-built dialog: Escape closes and returns
 * focus to the trigger, the page behind is locked, focus moves into the panel,
 * and the trigger exposes its state through `aria-expanded`. It is only
 * rendered below `lg`; the desktop tabs in the header are hidden there, so a
 * screen reader never meets two navigation landmarks at once.
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
        className="-ml-2 lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen(true)}
      >
        <Menu size={19} aria-hidden="true" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/45"
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
            className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[88vw] flex-col border-r border-line bg-background"
          >
            <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-5">
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-[2px] bg-content font-display text-[14px] font-medium leading-none text-background"
                >
                  N
                </span>
                <span className="font-display text-[19px] font-medium leading-none tracking-[-0.02em] text-content">
                  NeevPass
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2"
                aria-label="Close navigation menu"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <MobileNavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
