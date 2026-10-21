'use client';

import { Alert, Button, Label } from '@neevpass/ui';
import Image from 'next/image';
import { useActionState } from 'react';

import type { FormState } from '@/lib/forms';

import { removeProfilePhotoAction, uploadProfilePhotoAction } from './actions';

const EMPTY_STATE: FormState = {};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NP';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || 'NP';
}

export interface ProfilePhotoProps {
  readonly fullName: string;
  readonly photoUrl?: string;
  readonly revision: number;
}

/**
 * Optional profile photo, used by photo-led portfolio templates.
 *
 * The upload is a server action; the browser never receives a storage path. The
 * preview uses the same asset route as the public portfolio, so what the owner
 * sees here is exactly what a visitor will see.
 */
export function ProfilePhoto({ fullName, photoUrl, revision }: ProfilePhotoProps) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadProfilePhotoAction,
    EMPTY_STATE,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeProfilePhotoAction,
    EMPTY_STATE,
  );

  return (
    <section aria-labelledby="profile-photo-heading" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="profile-photo-heading" className="text-[13px] font-medium text-content">
          Profile photo
        </h2>
        <span className="text-[10px] uppercase tracking-[0.08em] text-content-muted">Optional</span>
      </div>

      <div className="relative aspect-[4/5] w-full max-w-[13rem] overflow-hidden rounded-[2px] border border-line bg-surface-sunken">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${fullName} profile photo`}
            fill
            sizes="13rem"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--color-surface-hover),var(--color-surface-sunken))]">
            <span className="grid size-16 place-items-center rounded-full border border-line-strong bg-surface font-display text-xl text-content-secondary">
              {initials(fullName)}
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-content-muted">
        Used by the Portrait portfolio template. JPEG, PNG or WebP, up to 5 MB.
      </p>

      <form action={uploadAction} className="flex flex-col gap-2">
        <input type="hidden" name="revision" value={revision} />
        <Label htmlFor="profile-photo-file" className="sr-only">
          Choose a profile photo
        </Label>
        <input
          id="profile-photo-file"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full min-w-0 text-[11px] text-content-secondary file:mr-2 file:cursor-pointer file:rounded-[3px] file:border file:border-line-strong file:bg-surface file:px-2.5 file:py-1.5 file:text-[11px] file:font-medium file:text-content hover:file:bg-surface-hover"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          isLoading={uploading}
          loadingLabel="Uploading"
        >
          {photoUrl ? 'Replace photo' : 'Upload photo'}
        </Button>
      </form>

      {uploadState.error ? (
        <Alert variant="danger" title="Could not upload">
          {uploadState.error}
        </Alert>
      ) : uploadState.ok && uploadState.message ? (
        <Alert variant="success" title="Saved">
          {uploadState.message}
        </Alert>
      ) : null}

      {photoUrl ? (
        <form action={removeAction}>
          <input type="hidden" name="revision" value={revision} />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            isLoading={removing}
            loadingLabel="Removing"
            className="w-full"
          >
            Remove photo
          </Button>
        </form>
      ) : null}

      {removeState.error ? (
        <Alert variant="danger" title="Could not remove">
          {removeState.error}
        </Alert>
      ) : removeState.ok && removeState.message ? (
        <Alert variant="success" title="Removed">
          {removeState.message}
        </Alert>
      ) : null}
    </section>
  );
}
