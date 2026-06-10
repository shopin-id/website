import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

async function generateSignature(timestamp: string, apiSecret: string) {
  const msgBuffer = new TextEncoder().encode(`timestamp=${timestamp}${apiSecret}`);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  
  const user = await getAuthUser(c)
  if (!user) return c.json({ success: false, message: 'Unauthorized.' }, 401)

  try {
    const settings = await db.prepare(`
      SELECT cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret 
      FROM platform_settings WHERE id = 1
    `).first()
    
    if (!settings || !settings.cloudinary_cloud_name || !settings.cloudinary_api_key || !settings.cloudinary_api_secret) {
      return c.json({ success: false, message: 'API Cloudinary belum dikonfigurasi di Pengaturan Admin.' }, 500)
    }

    const formData = await c.req.formData()
    const file = formData.get('file') as File
    if (!file) return c.json({ success: false, message: 'File gambar tidak terdeteksi.' }, 400)

    // PERBAIKAN: Memastikan tidak ada spasi sisa di database menggunakan .trim()
    const cloudName = (settings.cloudinary_cloud_name as string).trim();
    const apiKey = (settings.cloudinary_api_key as string).trim();
    const apiSecret = (settings.cloudinary_api_secret as string).trim();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = await generateSignature(timestamp, apiSecret);

    const cloudinaryData = new FormData();
    cloudinaryData.append('file', file);
    cloudinaryData.append('api_key', apiKey);
    cloudinaryData.append('timestamp', timestamp);
    cloudinaryData.append('signature', signature);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryData
    });

    const result = await uploadResponse.json() as any;

    if (result.secure_url) {
      return c.json({ success: true, url: result.secure_url });
    } else {
      return c.json({ success: false, message: result.error?.message || 'Error Cloudinary.' }, 500);
    }
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500)
  }
})
