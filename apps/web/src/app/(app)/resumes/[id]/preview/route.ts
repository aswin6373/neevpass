import { findResume, requireProfileAggregate } from '@neevpass/db';
import { buildSnapshot, renderResumeHtml } from '@neevpass/docgen';

import { requireProfile } from '@/lib/session';

/**
 * Print view for one resume.
 *
 * A route handler, not a page: it returns a complete HTML document (its own
 * `<html>`, print styles and `@page` rules), which is exactly what the
 * browser's print-to-PDF wants. Rendering that inside the app shell would
 * nest documents and break paged media. The response is private and must not
 * be cached or indexed.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;

  const { user, scope } = await requireProfile();
  const resume = await findResume(scope.profileId, id);
  if (!resume) {
    return new Response('Resume not found.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const aggregate = await requireProfileAggregate(scope.profileId);
  const snapshot = buildSnapshot({
    aggregate,
    revision: aggregate.revision,
    now: new Date(),
    email: user.email,
  });

  const html = renderResumeHtml({
    snapshot,
    config: resume.config,
    title: resume.title,
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
