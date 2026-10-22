'use client';

import { Alert, Button } from '@neevpass/ui';
import Image from 'next/image';
import { useActionState, useRef, useState } from 'react';

import type { FormState } from '@/lib/forms';
import { PROFILE_PHOTO_ACCEPT, validateSelectedPhoto } from '@/lib/photo-limits';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function selectFile(file: File | undefined): void {
    setFileName(file?.name ?? null);
    setFileError(file ? validateSelectedPhoto(file) : null);
  }

  const [uploadState, uploadAction, uploading] = useActionState(
    uploadProfilePhotoAction,
    EMPTY_STATE,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeProfilePhotoAction,
    EMPTY_STATE,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-[1px] border border-line bg-surface-sunken">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${fullName} profile photo`}
              fill
              sizes="4rem"
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="np-mono text-[11px] text-content-muted">{initials(fullName)}</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <form action={uploadAction} className="flex flex-col gap-1.5">
            <input type="hidden" name="revision" value={revision} />
            <input
              ref={inputRef}
              name="photo"
              type="file"
              accept={PROFILE_PHOTO_ACCEPT}
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                {photoUrl ? 'Replace' : 'Choose photo'}
              </Button>

              {fileName && !fileError ? (
                <Button type="submit" size="sm" isLoading={uploading} loadingLabel="Uploading">
                  Upload
                </Button>
              ) : null}
            </div>

            {fileName ? (
              <p className="max-w-[10rem] truncate font-mono text-[10px] text-content-muted">
                {fileName}
              </p>
            ) : null}
          </form>

          {photoUrl ? (
            <form action={removeAction}>
              <input type="hidden" name="revision" value={revision} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                isLoading={removing}
                loadingLabel="Removing"
                className="-ml-2"
              >
                Remove
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {fileError ? (
        <Alert variant="danger" title="Could not upload">
          {fileError}
        </Alert>
      ) : uploadState.error ? (
        <Alert variant="danger" title="Could not upload">
          {uploadState.error}
        </Alert>
      ) : uploadState.ok && uploadState.message ? (
        <Alert variant="success" title="Saved">
          {uploadState.message}
        </Alert>
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
    </div>
  );
}
