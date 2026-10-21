/**
 * @neevpass/domain — the pure domain layer.
 *
 * Hard rule: nothing in this package may import React, Next.js, Prisma, a
 * database driver, `fetch`, or any Node built-in. It compiles with
 * `"types": []` so those imports fail at type-check time rather than at review
 * time. That constraint is what makes the career engines and the document model
 * testable with plain objects and no infrastructure.
 */

export * from './constants';
export * from './errors';
export * from './result';

export * from './identity/password';

export * from './profile/sections';
export * from './profile/visibility';

export * from './validation/primitives';
