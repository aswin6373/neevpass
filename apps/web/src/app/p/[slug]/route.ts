import { findPublishedPortfolio, requireProfileAggregate } from '@neevpass/db';
import { buildSnapshot, renderPortfolioHtml } from '@neevpass/docgen';

/**
 * The public portfolio page.
 *
 * A route handler because the portfolio renderer returns a complete document
 * (its own `<html>`, template CSS and accent tokens) — wrapping that in the app
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
    templateKey: portfolio.templateKey,
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
  body { font-family: ui-serif, "New York", Georgia, serif; margin: 0; min-height: 100vh;
         display: grid; place-items: center; background: #f4efe6; color: #191613; }
  main { width: min(26rem, calc(100% - 3rem)); padding: 2rem 0;
         border-top: 1px solid #d8d1c4; border-bottom: 1px solid #d8d1c4; }
  h1 { font-size: 1.6rem; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 .5rem; }
  p { color: #6b6357; margin: 0 0 1.25rem; line-height: 1.6; }
  a { display: inline-block; padding: .5rem .9rem; border-radius: 3px;
      background: #191613; color: #f4efe6; text-decoration: none;
      font-family: ui-sans-serif, system-ui, sans-serif; font-size: .8125rem; }
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
