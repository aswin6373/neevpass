import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { AppError } from '@neevpass/domain';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

interface PhotoKind {
  readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly extension: 'jpg' | 'png' | 'webp';
}

export interface ParsedPhoto {
  readonly buffer: Buffer;
  readonly mimeType: PhotoKind['mimeType'];
  readonly extension: PhotoKind['extension'];
}

export interface SavedPhoto {
  readonly storageKey: string;
  readonly mimeType: PhotoKind['mimeType'];
  readonly byteSize: number;
}

function storageRoot(): string {
  // Uploaded photos are runtime data, not build inputs. UPLOAD_DIR may point at
  // a mounted volume outside the project, so tell Turbopack not to trace this
  // path — otherwise it assumes the whole project belongs in the build output.
  return path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? path.join(process.cwd(), '.uploads'),
  );
}

function storagePath(storageKey: string): string {
  const root = storageRoot();
  const resolved = path.resolve(/* turbopackIgnore: true */ root, storageKey);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw AppError.validation('The uploaded file reference was invalid.');
  }
  return resolved;
}

function sniffPhoto(buffer: Buffer): PhotoKind {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  throw AppError.validation('Choose a JPEG, PNG or WebP image.');
}

export async function parsePhotoUpload(value: FormDataEntryValue | null): Promise<ParsedPhoto> {
  if (!(value instanceof File) || value.size === 0) {
    throw AppError.validation('Choose a photo to upload.');
  }

  if (value.size > MAX_PHOTO_BYTES) {
    throw AppError.validation('Keep the photo below 5 MB.');
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  const kind = sniffPhoto(buffer);

  return { buffer, ...kind };
}

export async function savePhoto(photo: ParsedPhoto): Promise<SavedPhoto> {
  const storageKey = path.posix.join('profile-photos', `${randomUUID()}.${photo.extension}`);
  const target = storagePath(storageKey);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, photo.buffer, { flag: 'wx' });

  return {
    storageKey,
    mimeType: photo.mimeType,
    byteSize: photo.buffer.byteLength,
  };
}

export async function readPhoto(storageKey: string): Promise<Buffer> {
  try {
    return await readFile(storagePath(storageKey));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw AppError.notFound('The photo could not be found.');
    }
    throw error;
  }
}

export async function deletePhoto(storageKey: string): Promise<void> {
  try {
    await rm(storagePath(storageKey), { force: true });
  } catch {
    // Cleanup is best-effort. The database has already stopped referencing the
    // file, so a leftover object is an operational sweep, not a user failure.
  }
}
