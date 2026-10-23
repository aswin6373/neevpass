import { cn } from '@neevpass/ui';

import { Topbar } from '@/components/layout/topbar';
import { LoadingRegion } from '@/components/loading/skeletons';

function Bar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse', className)} />;
}

/**
 * Loading state for the public marketing surface.
 *
 * The header is real so the page does not jump when the content arrives; the
 * rest is a paper-and-ink outline of the hero and the first editorial section.
 */
export default function Loading() {
  return (
    <div className="np-marketing flex min-h-dvh flex-col bg-[var(--m-paper)]">
      <Topbar />

      <main className="flex-1">
        <LoadingRegion label="Loading page">
          <section className="relative overflow-hidden bg-[var(--m-navy)]">
            <div className="mx-auto grid w-full max-w-[80rem] gap-14 px-5 pb-14 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-20 lg:px-14 lg:pb-20 lg:pt-24">
              <div>
                <Bar className="h-2.5 w-28 bg-[var(--m-copper-light)]/40" />

                <div className="mt-7 flex flex-col gap-3">
                  <Bar className="h-11 w-full max-w-[30rem] bg-white/15 sm:h-14" />
                  <Bar className="h-11 w-4/5 max-w-[26rem] bg-[var(--m-copper-light)]/25 sm:h-14" />
                </div>

                <div className="mt-8 flex flex-col gap-2">
                  <Bar className="h-2.5 w-full max-w-[32rem] bg-white/10" />
                  <Bar className="h-2.5 w-5/6 max-w-[29rem] bg-white/10" />
                  <Bar className="h-2.5 w-2/3 max-w-[22rem] bg-white/10" />
                </div>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Bar className="h-[50px] w-full bg-[var(--m-copper)]/50 sm:w-48" />
                  <Bar className="h-[50px] w-full border border-white/15 bg-white/5 sm:w-40" />
                </div>

                <Bar className="mt-6 h-2.5 w-28 bg-white/10" />
              </div>

              <div className="relative mx-auto w-full max-w-[28rem] lg:max-w-none">
                <div className="absolute inset-x-5 bottom-[-1.25rem] top-8 rotate-[4deg] border border-[var(--m-line-on-dark)] bg-[var(--m-ivory)]/20" />

                <div className="relative rotate-[1.2deg] border border-[var(--m-line)] bg-[var(--m-paper)] p-5 shadow-[0_40px_90px_rgba(0,0,0,0.38)] sm:p-7">
                  <div className="flex items-center justify-between gap-4 border-b border-[var(--m-line)] pb-3">
                    <Bar className="h-2 w-24 bg-[#ded6c8]" />
                    <Bar className="h-2 w-12 bg-[#ded6c8]" />
                  </div>

                  <Bar className="mt-6 h-7 w-44 max-w-full bg-[#ded6c8]" />
                  <Bar className="mt-2 h-2.5 w-60 max-w-full bg-[#ece6db]" />
                  <Bar className="mt-5 h-px w-full bg-[#ded6c8]" />

                  {[0, 1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between gap-4 border-b border-[#ece6db] py-3.5"
                    >
                      <Bar className="h-2.5 w-24 bg-[#ece6db]" />
                      <Bar className="h-2.5 w-12 bg-[#ded6c8]" />
                    </div>
                  ))}

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((item) => (
                      <Bar key={item} className="h-9 w-full bg-[#ece6db]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[80rem] px-5 sm:px-8 lg:px-14">
              <div className="grid grid-cols-3 gap-4 border-t border-white/10 py-7 sm:gap-8">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex flex-col gap-2">
                    <Bar className="h-7 w-12 bg-[var(--m-copper-light)]/25" />
                    <Bar className="h-2 w-24 max-w-full bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[var(--m-paper)]">
            <div className="mx-auto w-full max-w-[80rem] px-5 py-16 sm:px-8 lg:px-14 lg:py-20">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
                <div>
                  <Bar className="h-2.5 w-24 bg-[var(--m-copper-text)]/30" />
                  <Bar className="mt-5 h-9 w-full max-w-md bg-[#e8e1d4]" />
                  <Bar className="mt-2 h-9 w-3/4 max-w-sm bg-[#e8e1d4]" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="border-t border-[var(--m-line)] pt-4">
                      <Bar className="h-2.5 w-20 bg-[#e8e1d4]" />
                      <Bar className="mt-3 h-2 w-full bg-[#ece6db]" />
                      <Bar className="mt-2 h-2 w-4/5 bg-[#ece6db]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </LoadingRegion>
      </main>
    </div>
  );
}
