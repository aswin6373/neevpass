/**
 * Password policy and hashing contract.
 *
 * The *policy* lives here because it is a domain rule. The *implementation*
 * lives in the application layer (`apps/web/src/lib/password.ts`) because
 * hashing needs a platform crypto module, and this package compiles with
 * `"types": []` so that no Node or browser API can be imported by accident.
 *
 * Keeping the interface here means the hashing algorithm can be swapped
 * (scrypt today, Argon2id when the native dependency is worth it) without any
 * caller changing.
 */

export interface PasswordHasher {
  /** Returns an encoded digest that embeds the algorithm and its parameters. */
  hash(plaintext: string): Promise<string>;
  /** Constant-time comparison against a previously produced digest. */
  verify(digest: string, plaintext: string): Promise<boolean>;
}

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * A very small deny-list of passwords that would otherwise pass the length
 * rule. This is not a substitute for a breach-corpus check, but it removes the
 * most obviously guessable choices without shipping a large word list.
 */
const COMMON_PASSWORDS = new Set([
  'password1234',
  'passwordpassword',
  'qwertyuiop123',
  '123456789012',
  'letmeinletmein',
  'iloveyouiloveyou',
  'administrator',
  'welcome12345',
  'changemenow1',
  'neevpass1234',
]);

export type PasswordIssueCode =
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'TOO_COMMON'
  | 'NEEDS_VARIETY'
  | 'CONTAINS_WHITESPACE_EDGES';

export interface PasswordIssue {
  readonly code: PasswordIssueCode;
  readonly message: string;
}

export const PASSWORD_POLICY_DESCRIPTION =
  `At least ${PASSWORD_MIN_LENGTH} characters, and not a commonly used password.`;

/**
 * Checks a candidate password against the policy.
 * Returns the list of problems; an empty list means the password is acceptable.
 */
export function checkPasswordStrength(password: string): readonly PasswordIssue[] {
  const issues: PasswordIssue[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push({
      code: 'TOO_SHORT',
      message: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    });
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    issues.push({
      code: 'TOO_LONG',
      message: `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
    });
  }

  if (password !== password.trim()) {
    issues.push({
      code: 'CONTAINS_WHITESPACE_EDGES',
      message: 'Remove spaces from the start and end of your password.',
    });
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    issues.push({
      code: 'TOO_COMMON',
      message: 'This password is too common. Please choose a different one.',
    });
  }

  // Require at least two character classes. Length does most of the work, so
  // this is deliberately gentle rather than a four-class rule.
  if (password.length > 0 && countCharacterClasses(password) < 2) {
    issues.push({
      code: 'NEEDS_VARIETY',
      message: 'Mix in at least two of: lowercase letters, uppercase letters, numbers, symbols.',
    });
  }

  return issues;
}

export function isPasswordAcceptable(password: string): boolean {
  return checkPasswordStrength(password).length === 0;
}

function countCharacterClasses(password: string): number {
  let classes = 0;
  if (/[a-z]/.test(password)) classes += 1;
  if (/[A-Z]/.test(password)) classes += 1;
  if (/[0-9]/.test(password)) classes += 1;
  if (/[^A-Za-z0-9]/.test(password)) classes += 1;
  return classes;
}
