import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import healthHandler from './api/health';
import configHandler from './api/config';
import sheetsGetHandler from './api/sheets/get';
import sheetsPostHandler from './api/sheets/post';

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;

        const decoratedRes: any = res;
        decoratedRes.status = (code: number) => {
          res.statusCode = code;
          return decoratedRes;
        };
        decoratedRes.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return decoratedRes;
        };

        const queryObj: Record<string, string> = {};
        url.searchParams.forEach((val, key) => {
          queryObj[key] = val;
        });
        const decoratedReq: any = req;
        decoratedReq.query = queryObj;

        if (pathname === '/api/health') {
          return healthHandler(decoratedReq, decoratedRes);
        }
        if (pathname === '/api/config') {
          return configHandler(decoratedReq, decoratedRes);
        }
        if (pathname === '/api/sheets/get') {
          return sheetsGetHandler(decoratedReq, decoratedRes);
        }
        if (pathname === '/api/sheets/post') {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const rawBody = Buffer.concat(buffers).toString();
          try {
            decoratedReq.body = JSON.parse(rawBody);
          } catch {
            decoratedReq.body = rawBody;
          }
          return sheetsPostHandler(decoratedReq, decoratedRes);
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
