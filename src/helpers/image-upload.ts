import type { HomeAssistant } from '../types.js';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type ImageUploadErrorCode = 'bad-type' | 'too-large' | 'upload-failed';

export class ImageUploadError extends Error {
  constructor(public readonly code: ImageUploadErrorCode, message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export async function uploadImage(file: File, hass: HomeAssistant): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      'bad-type',
      `Dateityp ${file.type} nicht erlaubt. Erlaubt: ${ALLOWED_TYPES.join(', ')}`,
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError(
      'too-large',
      `Datei zu gross (max. ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = hass.auth?.data?.access_token ?? '';
  const response = await fetch('/api/image/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new ImageUploadError(
      'upload-failed',
      `Upload fehlgeschlagen: HTTP ${response.status}`,
    );
  }

  const data = (await response.json()) as { id: string };
  return `/api/image/serve/${data.id}/original`;
}
