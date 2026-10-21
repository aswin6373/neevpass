import { prisma } from '@neevpass/db';
import { NextResponse } from 'next/server';

import { readPhoto } from '@/lib/photo-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteProps {
  readonly params: Promise<{ id: string }>;
}

/**
 * Serves uploaded profile photos.
 *
 * Assets are addressed by an unguessable id and are intentionally cacheable:
 * a replacement receives a new id, so a cached response for an old id can never
 * show the wrong person. Only `profile-photo` assets are exposed here; other
 * upload purposes will need their own access rules.
 */
export async function GET(_request: Request, { params }: RouteProps): Promise<Response> {
  const { id } = await params;

  const asset = await prisma.fileAsset.findFirst({
    where: { id, purpose: 'profile-photo', deletedAt: null },
    select: { storageKey: true, mimeType: true, byteSize: true },
  });

  if (!asset) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const buffer = await readPhoto(asset.storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'content-type': asset.mimeType,
        'content-length': String(buffer.byteLength),
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
