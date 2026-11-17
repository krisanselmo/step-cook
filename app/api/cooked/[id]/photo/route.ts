import { readPhoto } from '@/app/lib/cooked';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photo = await readPhoto(id);

  if (!photo) {
    return new Response('Photo introuvable', { status: 404 });
  }

  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      'Content-Type': photo.contentType,
      'Content-Length': String(photo.bytes.length),
      // A photo never changes under its id.
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
