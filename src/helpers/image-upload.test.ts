import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadImage,
  ImageUploadError,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
} from './image-upload.js';
import type { HomeAssistant } from '../types.js';

function makeHass(token = 'TEST-TOKEN'): HomeAssistant {
  return {
    states: {},
    callService: vi.fn(),
    auth: { data: { access_token: token } },
  };
}

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('uploadImage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects unsupported file types', async () => {
    const file = makeFile('a.gif', 'image/gif', 100);
    await expect(uploadImage(file, makeHass())).rejects.toBeInstanceOf(ImageUploadError);
    await expect(uploadImage(file, makeHass())).rejects.toMatchObject({ code: 'bad-type' });
  });

  it('rejects files larger than the max', async () => {
    const file = makeFile('a.png', 'image/png', MAX_FILE_SIZE + 1);
    await expect(uploadImage(file, makeHass())).rejects.toMatchObject({ code: 'too-large' });
  });

  it('posts the file with auth header and returns the serve URL', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 })
    );

    const file = makeFile('a.png', 'image/png', 1000);
    const url = await uploadImage(file, makeHass('TOK-XYZ'));

    expect(url).toBe('/api/image/serve/abc-123/original');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('/api/image/upload');
    expect((options as RequestInit).method).toBe('POST');
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer TOK-XYZ');
    expect((options as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('throws upload-failed on non-2xx response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const file = makeFile('a.png', 'image/png', 1000);
    await expect(uploadImage(file, makeHass())).rejects.toMatchObject({
      code: 'upload-failed',
    });
  });

  it('exports ALLOWED_TYPES with the three expected types', () => {
    expect(ALLOWED_TYPES).toEqual(['image/png', 'image/jpeg', 'image/webp']);
  });
});
