import { defineConfig, type Plugin } from 'vite';

function mockHaImageApi(): Plugin {
  const blobStore = new Map<string, { data: Buffer; type: string }>();

  return {
    name: 'mock-ha-image-api',
    configureServer(server) {
      server.middlewares.use('/api/image/upload', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          const contentType = req.headers['content-type'] ?? '';
          const boundaryMatch = /boundary=(.+)$/.exec(contentType);
          if (!boundaryMatch) {
            res.statusCode = 400;
            res.end('Missing boundary');
            return;
          }
          const headerSep = '\r\n\r\n';
          const sepIdx = body.indexOf(Buffer.from(headerSep));
          if (sepIdx === -1) {
            res.statusCode = 400;
            res.end('Malformed body');
            return;
          }
          const partHeaders = body.subarray(0, sepIdx).toString();
          const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(partHeaders);
          const fileType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
          const dataStart = sepIdx + headerSep.length;
          const closing = Buffer.from(`\r\n--${boundaryMatch[1]}`);
          const dataEnd = body.indexOf(closing, dataStart);
          const fileData = body.subarray(dataStart, dataEnd === -1 ? body.length : dataEnd);
          const id = Math.random().toString(36).slice(2, 10);
          blobStore.set(id, { data: fileData, type: fileType });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ id, filename: 'upload', content_type: fileType }));
        });
      });

      server.middlewares.use((req, res, next) => {
        const match = /^\/api\/image\/serve\/([^/]+)/.exec(req.url ?? '');
        if (!match) {
          next();
          return;
        }
        const blob = blobStore.get(match[1]);
        if (!blob) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader('Content-Type', blob.type);
        res.setHeader('Cache-Control', 'no-store');
        res.end(blob.data);
      });
    },
  };
}

export default defineConfig({
  plugins: [mockHaImageApi()],
});
