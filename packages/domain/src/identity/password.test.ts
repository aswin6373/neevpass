import { describe, expect, it } from 'vitest';

import {
  PASSWORD_MIN_LENGTH,
  checkPasswordStrength,
  isPasswordAcceptable,
} from './password';

const issueCodes = (password: string) => checkPasswordStrength(password).map((issue) => issue.code);

describe('password policy', () => {
  it('accepts a reasonable passphrase', () => {
    expect(isPasswordAcceptable('correct horse battery staple')).toBe(true);
    expect(isPasswordAcceptable('Tr0ub4dor&3xyz')).toBe(true);
  });

  it('rejects anything shorter than the minimum', () => {
    expect(issueCodes('short1A')).toContain('TOO_SHORT');
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  it('rejects a password that is only one character class', () => {
    expect(issueCodes('aaaaaaaaaaaaaa')).toContain('NEEDS_VARIETY');
  });

  it('rejects common passwords even when long enough', () => {
    expect(issueCodes('passwordpassword')).toContain('TOO_COMMON');
    expect(issueCodes('neevpass1234')).toContain('TOO_COMMON');
  });

  it('is case-insensitive when matching the deny-list', () => {
    expect(issueCodes('PassWordPassWord'.toLowerCase())).toContain('TOO_COMMON');
  });

  it('rejects surrounding whitespace, which is almost always a paste error', () => {
    expect(issueCodes(' correct horse battery staple ')).toContain('CONTAINS_WHITESPACE_EDGES');
  });

  it('rejects an over-long input', () => {
    expect(issueCodes('a1'.repeat(80))).toContain('TOO_LONG');
  });

  it('reports every problem at once so the user fixes them in one pass', () => {
    const codes = issueCodes('short');
    expect(codes).toContain('TOO_SHORT');
    expect(codes).toContain('NEEDS_VARIETY');
  });
});
