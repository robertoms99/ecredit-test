import { httpServer, startHttpServer } from './infrastructure/http-server';
import app from './infrastructure/presentation';
import { IncomingMessage, ServerResponse } from 'http';

httpServer.on('request', async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const protocol = 'http';
    const host = req.headers.host || 'localhost:3000';
    const url = `${protocol}://${host}${req.url}`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
    });

    let body: ReadableStream | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      body = new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        }
      });
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const response = await app.fetch(request);

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

await import('./infrastructure/di');

await startHttpServer();
console.log(`✅ Socket.IO server initialized`);
