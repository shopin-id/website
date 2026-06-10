import type { Context } from 'hono';

// Fungsi untuk generate ID unik (Pengganti UUID sederhana)
export const generateId = () => Math.random().toString(36).substring(2, 15);

// Fungsi Upload ke R2
export async function uploadToR2(c: Context, file: File): Promise<string> {
  const bucket = c.env.IMAGE_BUCKET;
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  
  // R2 memerlukan data dalam bentuk ArrayBuffer atau ReadableStream
  const arrayBuffer = await file.arrayBuffer();
  
  await bucket.put(fileName, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  // GANTI URL_BASE_R2 dengan URL public bucket R2 Anda (Custom Domain atau R2.dev)
  const R2_PUBLIC_URL = `https://cdn.visoeluxury.com`; 
  return `${R2_PUBLIC_URL}/${fileName}`;
}

// Fungsi Invalidate Cache (Menghapus cache agar data terbaru muncul)
export async function invalidateProductCache(c: Context) {
  const kv = c.env.CACHE_KV;
  await kv.delete('products:active:all');
  // Jika ada cache detail per slug, idealnya dihapus juga di sini
}