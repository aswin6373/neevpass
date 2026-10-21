import { requireProfileAggregate } from '@neevpass/db';
import {
  buildSnapshot,
  normalisePortfolioConfig,
  renderPortfolioHtml,
} from '@neevpass/docgen';

import { requireProfile } from '@/lib/session';

/**
 * Draft preview for the portfolio studio.
 *
 * The iframe renders this URL with the current, unsaved form values. It uses
 * the same public-only snapshot as `/p/[slug]`, so the preview is truthful:
 * private entries cannot appear in it, and switching a template never requires
 * saving first.
 */
export async function GET(request: Request): Promise<Response> {
  const { scope } = await requireProfile();
  const url = new URL(request.url);

  const aggregate = await requireProfileAggregate(scope.profileId);
  const config = normalisePortfolioConfig({
    templateKey: url.searchParams.get('template'),
    accentColor: url.searchParams.get('accent'),
    hiddenSections: (url.searchParams.get('hidden') ?? '').split(',').filter(Boolean),
  });
  const title = (url.searchParams.get('title') ?? '').trim().slice(0, 120) || 'Portfolio preview';

  const snapshot = buildSnapshot({
    aggregate,
    revision: aggregate.revision,
    now: new Date(),
    publicOnly: true,
  });

  const html = renderPortfolioHtml({
    snapshot,
    config,
    templateKey: config.templateKey,
    title,
    summary: aggregate.summary,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
