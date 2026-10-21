import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { PasswordHasher } from '@neevpass/domain';

/**
 * Password hashing — the Node implementation of the `PasswordHasher` contract
 * declared in @neevpass/domain.
 *
 * ALGORITHM NOTE
 * --------------
 * The architecture proposal specified Argon2id. This ships scrypt instead, for
 * one concrete reason: Argon2 needs a native module, and a native build step is
 * a recurring source of "works on my machine" failures in CI and in containers.
 * scrypt is memory-hard, is on the OWASP recommended list, and is implemented
 * in Node core with no dependency at all.
 *
 * This is a deliberate, reversible decision rather than a shortcut. Because
 * callers depend on the `PasswordHasher` interface and the digest is
 * self-describing (it carries its algorithm and parameters), switching to
 * Argon2id later is a change to this file plus a rehash-on-next-login path. No
 * caller and no database column changes.
 *
 * PARAMETERS
 * ----------
 * N = 2^15 (32768), r = 8, p = 1, 64-byte output.
 * That is roughly 33 MB of memory and a few tens of milliseconds per hash on
 * current hardware — high enough to make offline cracking expensive, low enough
 * not to be a denial-of-service vector on the sign-in route.
 *
 * Node's default `maxmem` is 32 MB, which is *below* the 128 * N * r requirement
 * of these parameters, so it must be raised explicitly or scrypt throws.
 */

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** 128 * N * r is the documented minimum; we double it for headroom. */
const MAX_MEM = 128 * SCRYPT_N * SCRYPT_R * 2;

type ScryptFn = (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const scrypt = promisify(scryptCallback) as unknown as ScryptFn;

const ALGORITHM = 'scrypt';

function deriveKey(password: string, salt: Buffer, keyLength: number): Promise<Buffer> {
  // NFKC normalisation means the same typed password produces the same bytes
  // regardless of how the user's keyboard composed the characters.
  return scrypt(password.normalize('NFKC'), salt, keyLength, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  });
}

export const passwordHasher: PasswordHasher = {
  async hash(plaintext: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derived = await deriveKey(plaintext, salt, KEY_LENGTH);

    // Self-describing digest: algorithm and parameters travel with the hash, so
    // parameters can be strengthened later without invalidating existing rows.
    return [
      ALGORITHM,
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString('base64'),
      derived.toString('base64'),
    ].join('$');
  },

  async verify(digest: string, plaintext: string): Promise<boolean> {
    const parts = digest.split('$');

    if (parts.length !== 6 || parts[0] !== ALGORITHM) {
      // Not a digest we produced. Returning false rather than throwing keeps
      // this function total, so a malformed row cannot crash the sign-in route.
      return false;
    }

    const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;
    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);

    if (!Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p)) {
      return false;
    }

    const salt = Buffer.from(saltRaw ?? '', 'base64');
    const expected = Buffer.from(hashRaw ?? '', 'base64');

    if (salt.length === 0 || expected.length === 0) return false;

    const derived = await scrypt(plaintext.normalize('NFKC'), salt, expected.length, {
      N,
      r,
      p,
      maxmem: Math.max(MAX_MEM, 128 * N * r * 2),
    });

    // Length check first: timingSafeEqual throws on a length mismatch.
    if (derived.length !== expected.length) return false;

    return timingSafeEqual(derived, expected);
  },
};
