/**
 * Profile-photo limits shared by the client form and the server action.
 *
 * This module deliberately has no Node.js imports so the file picker can give
 * immediate feedback without shipping `node:fs` to the browser. The server
 * still validates the bytes; these checks only avoid a pointless round trip.
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** MIME types the server can identify from their magic bytes. */
export const PROFILE_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const PROFILE_PHOTO_ACCEPT = PROFILE_PHOTO_MIME_TYPES.join(',');

const CLIENT_MIME_TYPES = new Set<string>([
  ...PROFILE_PHOTO_MIME_TYPES,
  // Some browsers report the non-standard alias for a JPEG.
  'image/jpg',
]);

export interface SelectablePhoto {
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

/**
 * Returns the message to show above the picker, or null when the file looks
 * usable. An empty MIME type is accepted: the server sniffs the bytes and is
 * the authority on the actual format.
 */
export function validateSelectedPhoto(file: SelectablePhoto): string | null {
  if (file.size === 0) return 'Choose a photo to upload.';
  if (file.size > MAX_PHOTO_BYTES) return 'Keep the photo below 5 MB.';
  if (file.type && !CLIENT_MIME_TYPES.has(file.type)) {
    return 'Choose a JPEG, PNG or WebP image.';
  }
  return null;
}
