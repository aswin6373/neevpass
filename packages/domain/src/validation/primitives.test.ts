import { describe, expect, it } from 'vitest';

import {
  emailSchema,
  optionalUrlSchema,
  publicSlugSchema,
  slugSchema,
  urlSchema,
  yearMonthSchema,
} from './primitives';

describe('emailSchema', () => {
  it('normalises case and surrounding whitespace', () => {
    expect(emailSchema.parse('  AsWin@Example.COM ')).toBe('aswin@example.com');
  });

  it('rejects malformed addresses', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(emailSchema.safeParse('a@b').success).toBe(false);
    expect(emailSchema.safeParse('').success).toBe(false);
  });
});

describe('urlSchema', () => {
  it('accepts http and https', () => {
    expect(urlSchema.safeParse('https://github.com/aswin').success).toBe(true);
    expect(urlSchema.safeParse('http://example.com').success).toBe(true);
  });

  it('rejects dangerous schemes that would become stored XSS', () => {
    expect(urlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    expect(urlSchema.safeParse('data:text/html;base64,PHNjcmlwdD4=').success).toBe(false);
    expect(urlSchema.safeParse('vbscript:msgbox(1)').success).toBe(false);
  });

  it('rejects a bare domain with no scheme', () => {
    expect(urlSchema.safeParse('github.com/aswin').success).toBe(false);
  });
});

describe('optionalUrlSchema', () => {
  it('treats an empty string as "not provided"', () => {
    expect(optionalUrlSchema.parse('')).toBeUndefined();
    expect(optionalUrlSchema.parse('https://example.com')).toBe('https://example.com');
  });
});

describe('slugSchema', () => {
  it('accepts a well-formed slug', () => {
    expect(slugSchema.parse('AsWin-Kumar')).toBe('aswin-kumar');
    expect(slugSchema.parse('abc')).toBe('abc');
  });

  it('rejects leading, trailing and doubled hyphens', () => {
    expect(slugSchema.safeParse('-abc').success).toBe(false);
    expect(slugSchema.safeParse('abc-').success).toBe(false);
    expect(slugSchema.safeParse('ab--c').success).toBe(false);
  });

  it('rejects slugs that are too short or too long', () => {
    expect(slugSchema.safeParse('ab').success).toBe(false);
    expect(slugSchema.safeParse('a'.repeat(41)).success).toBe(false);
  });

  it('rejects characters that would need escaping in a URL', () => {
    expect(slugSchema.safeParse('aswin kumar').success).toBe(false);
    expect(slugSchema.safeParse('aswin/kumar').success).toBe(false);
  });
});

describe('publicSlugSchema', () => {
  it('blocks slugs that collide with application routes', () => {
    expect(publicSlugSchema.safeParse('dashboard').success).toBe(false);
    expect(publicSlugSchema.safeParse('api').success).toBe(false);
    expect(publicSlugSchema.safeParse('neevpass').success).toBe(false);
  });

  it('allows an ordinary name', () => {
    expect(publicSlugSchema.safeParse('aswin-kumar').success).toBe(true);
  });
});

describe('yearMonthSchema', () => {
  it('accepts YYYY-MM', () => {
    expect(yearMonthSchema.safeParse('2026-10').success).toBe(true);
  });

  it('rejects an impossible month or a full date', () => {
    expect(yearMonthSchema.safeParse('2026-13').success).toBe(false);
    expect(yearMonthSchema.safeParse('2026-00').success).toBe(false);
    expect(yearMonthSchema.safeParse('2026-10-08').success).toBe(false);
  });
});
