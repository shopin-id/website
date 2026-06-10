import {} from 'hono';

type Head = {
  title?: string;
  description?: string;
};

declare module 'hono' {
  interface Env {
    Variables: {};
    Bindings: {
      DB: D1Database;
      CACHE_KV: KVNamespace;
      IMAGE_BUCKET: R2Bucket;
    };
  }
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>;
  }
}