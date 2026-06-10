import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const db = c.env.DB;
  const signature = c.req.header('X-Callback-Signature');
  const payloadText = await c.req.text(); 
  
  // Sebaiknya Kunci API diambil dari c.env
  const CALLBACK_KEY = c.env.PAY101_CALLBACK_KEY || 'sk_proj_eigmAHfJTyIoE3meOIFGTJsqWIMQCBcy';

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(CALLBACK_KEY);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadText));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== expectedSignature) {
      return c.json({ error: 'Invalid Signature' }, 401);
    }

    const data = JSON.parse(payloadText);
    const orderId = data.merchant_ref_id;
    const status = data.status;

    if (status === 'PAID') {
      // PERBAIKAN KEAMANAN: Cek status saat ini di Database
      const order = await db.prepare("SELECT status FROM orders WHERE id = ?").bind(orderId).first();
      
      if (!order) return c.json({ error: 'Order not found' }, 404);
      
      // Jika statusnya SUDAH PAID, abaikan webhook ini agar stok tidak dipotong dua kali
      if (order.status === 'PAID') {
        return c.json({ success: true, note: 'Idempotent: Order already processed' });
      }

      await db.prepare("UPDATE orders SET status = 'PAID' WHERE id = ?").bind(orderId).run();
      
      // Mengurangi stok produk
      const { results: items } = await db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").bind(orderId).all();
      for(const item of items) {
         await db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").bind(item.quantity, item.product_id).run();
      }
    } else if (status === 'FAILED' || status === 'EXPIRED') {
      await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, orderId).run();
    }

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});
