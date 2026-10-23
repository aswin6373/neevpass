'use client';

import { Button } from '@neevpass/ui';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Brand } from './brand';
import { SidebarFooter, SidebarNav } from './sidebar';

/**
 * Mobile navigation drawer.
 *
 * Follows the usual dialog contract: Escape closes and returns focus to the
 * trigger, the page behind is locked, focus moves into the panel, and the
 * trigger exposes its state through `aria-expanded`.
 */
export function MobileNav({ user }: { user: { name: string | null; email: string } }) {
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
        className="-ml-1.5"
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
            className="absolute inset-0 bg-[#04101a]/55 backdrop-blur-[2px]"
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
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[86vw] flex-col border-r border-line bg-surface"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <Brand href="/dashboard" />
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

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>

            <SidebarFooter
              user={user}
              onNavigate={() => setOpen(false)}
              className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            />
          </div>
        </div>
      )}
    </>
  );
}
