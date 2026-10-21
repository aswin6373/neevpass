import { findPublishedPortfolio, requireProfileAggregate } from '@neevpass/db';
import { buildSnapshot, renderPortfolioHtml } from '@neevpass/docgen';

/**
 * The public portfolio page.
 *
 * A route handler because the portfolio renderer returns a complete document
 * (its own `<html>`, print styles, theme tokens) — wrapping that in the app
 * shell would nest documents. The visibility contract is enforced here: the
 * snapshot is built with `publicOnly: true`, so PRIVATE entries never reach
 * the HTML, regardless of what the portfolio's config says.
 *
 * Unknown and unpublished addresses both return the same 404 body, so a
 * visitor cannot enumerate which slugs exist.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;

  const portfolio = await findPublishedPortfolio(slug.trim().toLowerCase());

  if (!portfolio) {
    return new Response(notFoundDocument(), {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  }

  const aggregate = await requireProfileAggregate(portfolio.profileId);
  const snapshot = buildSnapshot({
    aggregate,
    revision: aggregate.revision,
    now: new Date(),
    publicOnly: true,
  });

  const html = renderPortfolioHtml({
    snapshot,
    config: portfolio.config,
    title: portfolio.title,
    summary: aggregate.summary,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}

function notFoundDocument(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Portfolio not found — NeevPass</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; min-height: 100vh;
         display: grid; place-items: center; background: #fafafa; color: #18181b; }
  main { text-align: center; padding: 2rem; }
  h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
  p { color: #52525b; margin: 0 0 1rem; }
  a { color: #4f46e5; }
</style>
</head>
<body>
<main>
  <h1>This portfolio is not available</h1>
  <p>The address may be wrong, or the portfolio may have been unpublished.</p>
  <a href="/">Go to NeevPass</a>
</main>
</body>
</html>`;
}
