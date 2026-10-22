'use client';

import { Alert, Button, Field, Input, cn } from '@neevpass/ui';
import { Check } from 'lucide-react';
import { useActionState, useEffect, useMemo, useState } from 'react';

import { savePortfolioAction } from './actions';
import type { FormState } from '@/lib/forms';

const EMPTY_STATE: FormState = {};

export interface PortfolioTemplateChoice {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly defaultAccent: string;
}

export interface PortfolioSectionChoice {
  readonly kind: string;
  readonly label: string;
}

export interface PortfolioInitial {
  readonly title: string;
  readonly publicSlug: string;
  readonly published: boolean;
  readonly templateKey: string;
  readonly accentColor: string;
  readonly hiddenSections: readonly string[];
}

interface PreviewDraft {
  readonly templateKey: string;
  readonly accentColor: string;
  readonly title: string;
  readonly hiddenSections: readonly string[];
}

/**
 * The portfolio studio. Everything on the right updates the iframe on the left
 * without saving, which is what makes choosing a template feel like editing
 * rather than filling in a form and hoping.
 */
export function PortfolioStudio({
  revision,
  sections,
  templates,
  initial,
}: {
  revision: number;
  sections: readonly PortfolioSectionChoice[];
  templates: readonly PortfolioTemplateChoice[];
  initial: PortfolioInitial;
}) {
  const [state, formAction, pending] = useActionState(savePortfolioAction, EMPTY_STATE);

  const [templateKey, setTemplateKey] = useState(initial.templateKey);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [title, setTitle] = useState(initial.title);
  const [hiddenSections, setHiddenSections] = useState<string[]>([...initial.hiddenSections]);
  const [preview, setPreview] = useState<PreviewDraft>({
    templateKey: initial.templateKey,
    accentColor: initial.accentColor,
    title: initial.title,
    hiddenSections: initial.hiddenSections,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreview({
        templateKey,
        accentColor,
        title,
        hiddenSections,
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [templateKey, accentColor, title, hiddenSections]);

  const activeTemplate = templates.find((template) => template.key === templateKey);

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams();
    params.set('template', preview.templateKey);
    params.set('accent', preview.accentColor);
    params.set('title', preview.title.trim() || 'Portfolio preview');
    if (preview.hiddenSections.length > 0) {
      params.set('hidden', preview.hiddenSections.join(','));
    }
    return `/portfolios/preview?${params.toString()}`;
  }, [preview]);

  function chooseTemplate(template: PortfolioTemplateChoice) {
    setTemplateKey(template.key);
    const currentIsTemplateAccent = templates.some(
      (candidate) => candidate.defaultAccent.toLowerCase() === accentColor.toLowerCase(),
    );
    if (currentIsTemplateAccent) setAccentColor(template.defaultAccent);
  }

  function toggleHidden(kind: string) {
    setHiddenSections((current) =>
      current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
    );
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
      {/* Preview --------------------------------------------------------- */}
      <div className="order-1 min-w-0 xl:sticky xl:top-[84px]">
        <div className="overflow-hidden border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-content">Preview</span>
              <span className="np-mono text-[10px] text-content-muted">
                {activeTemplate?.label ?? 'Template'}
              </span>
            </div>
          </div>

          <div className="bg-surface-sunken p-2 sm:p-4">
            <div className="mx-auto overflow-hidden border border-line bg-white">
              <iframe
                title="Live portfolio preview"
                src={previewSrc}
                sandbox=""
                loading="lazy"
                className="h-[72vh] min-h-[520px] w-full sm:h-[80vh] sm:min-h-[620px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls -------------------------------------------------------- */}
      <aside className="order-2 min-w-0">
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="revision" value={revision} />
          <input type="hidden" name="templateKey" value={templateKey} />

          {state.error ? (
            <Alert variant="danger" title="Could not save">
              {state.error}
            </Alert>
          ) : state.ok && state.message ? (
            <Alert variant="success" title="Saved">
              {state.message}
            </Alert>
          ) : null}

          <fieldset>
            <legend className="text-[12px] font-medium text-content">Template</legend>
            <div className="mt-2 border-t border-line">
              {templates.map((template) => {
                const active = template.key === templateKey;
                return (
                  <button
                    key={template.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseTemplate(template)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-line px-1 py-3 text-left transition-colors',
                      active ? 'bg-surface-hover' : 'hover:bg-surface-hover',
                    )}
                  >
                    <TemplateSwatch templateKey={template.key} accent={template.defaultAccent} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-content">{template.label}</span>
                        {active ? (
                          <Check size={12} className="shrink-0 text-brand-text" aria-hidden="true" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-content-muted">
                        {template.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-4">
            <Field label="Title">
              <Input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
              />
            </Field>

            <Field
              label="Public address"
              error={state.fieldErrors?.publicSlug}
              description="Lowercase letters, numbers and hyphens."
            >
              <Input
                name="publicSlug"
                defaultValue={initial.publicSlug}
                placeholder="your-name"
                maxLength={40}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>

            <Field
              label="Accent colour"
              description={accentColor.toUpperCase()}
            >
              <Input
                name="accentColor"
                type="color"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                className="h-10 w-16 cursor-pointer p-1"
              />
            </Field>
          </div>

          <label className="flex items-start gap-3 border-y border-line py-3">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial.published}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--np-primary)]"
            />
            <span>
              <span className="block text-[12px] font-medium text-content">Published</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-content-muted">
                Unticking takes the page offline.
              </span>
            </span>
          </label>

          <fieldset>
            <legend className="text-[12px] font-medium text-content">Sections to hide</legend>
            <div className="mt-2 border-t border-line-subtle">
              {sections.map((section) => (
                <label
                  key={section.kind}
                  className="flex items-center gap-2.5 border-b border-line-subtle py-2 text-[12px] text-content-secondary transition-colors hover:text-content"
                >
                  <input
                    type="checkbox"
                    name="hiddenSections"
                    value={section.kind}
                    checked={hiddenSections.includes(section.kind)}
                    onChange={() => toggleHidden(section.kind)}
                    className="h-3.5 w-3.5 accent-[var(--np-primary)]"
                  />
                  {section.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" isLoading={pending} loadingLabel="Saving" block>
            Save portfolio
          </Button>
        </form>
      </aside>
    </div>
  );
}

/**
 * Four tiny swatches that read as miniature versions of the templates rather
 * than generic colour chips.
 */
function TemplateSwatch({ templateKey, accent }: { templateKey: string; accent: string }) {
  if (templateKey === 'STUDIO') {
    return (
      <span
        aria-hidden="true"
        className="relative block h-10 w-12 shrink-0 overflow-hidden border border-line"
        style={{ background: '#0b0b0c' }}
      >
        <span
          className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        <span className="absolute inset-x-2 bottom-3.5 h-[2px]" style={{ background: '#f4f0e8' }} />
        <span className="absolute inset-x-2 bottom-2 h-[2px] w-7" style={{ background: '#55524c' }} />
      </span>
    );
  }

  if (templateKey === 'POSTER') {
    return (
      <span
        aria-hidden="true"
        className="relative block h-10 w-12 shrink-0 overflow-hidden border border-line"
        style={{ background: '#f3efe4' }}
      >
        <span className="absolute -bottom-1 -right-1 h-5 w-5" style={{ background: accent }} />
        <span
          className="absolute left-1.5 top-1 font-sans text-[17px] font-black uppercase leading-none tracking-[-0.08em]"
          style={{ color: '#101010' }}
        >
          AA
        </span>
        <span className="absolute inset-x-1.5 top-6 h-[2px]" style={{ background: '#101010' }} />
        <span className="absolute inset-x-1.5 top-8 h-[1px] w-5" style={{ background: '#101010' }} />
      </span>
    );
  }

  if (templateKey === 'PORTRAIT') {
    return (
      <span
        aria-hidden="true"
        className="relative block h-10 w-12 shrink-0 overflow-hidden border border-line"
        style={{ background: '#f3eee4' }}
      >
        <span
          className="absolute bottom-1 left-1.5 top-1.5 w-4 rounded-t-full border"
          style={{ background: `${accent}29`, borderColor: accent }}
        />
        <span
          className="absolute left-[11px] top-3 h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        <span
          className="absolute left-2 top-2 h-[2px] w-1"
          style={{ background: '#7a6d5b' }}
        />
        <span
          className="absolute right-1.5 top-2 h-[2px] w-5"
          style={{ background: '#201d19' }}
        />
        <span
          className="absolute right-1.5 top-4 h-[1px] w-4"
          style={{ background: '#b8ab98' }}
        />
        <span
          className="absolute inset-x-1.5 top-6 h-[1px]"
          style={{ background: '#dcd2c1' }}
        />
        <span
          className="absolute inset-x-1.5 top-[29px] h-[2px] w-5"
          style={{ background: accent }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block h-10 w-12 shrink-0 border border-line p-1.5"
      style={{ background: '#f1ebdf' }}
    >
      <span className="block font-serif text-[13px] leading-none" style={{ color: '#191612' }}>
        Aa
      </span>
      <span className="mt-1.5 block h-[1px] w-full" style={{ background: '#d2c7b4' }} />
      <span className="mt-1 block h-[1px] w-8" style={{ background: accent }} />
    </span>
  );
}
