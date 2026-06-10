import { createRoute } from 'honox/factory'
import { generateId } from '../../utils/admin_utils'
import { getAuthUser } from '../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const user = await getAuthUser(c)
  
  if (!user) return c.redirect('/login?err=must_login')

  const cartDataRaw = formData.get('cart_data') as string
  const address = formData.get('address') as string
  const paymentMethod = formData.get('payment_method') as string || 'automatic'
  
  // PERBAIKAN 1: Cegah proses jika keranjang kosong secara eksplisit
  if (!cartDataRaw || cartDataRaw === '[]') {
    return c.redirect('/checkout?err=empty_cart')
  }

  try {
    const cart = JSON.parse(cartDataRaw)
    
    // PERBAIKAN 2: Validasi ulang isi array JSON keranjang
    if (!Array.isArray(cart) || cart.length === 0) {
       return c.redirect('/checkout?err=empty_cart')
    }

    let itemsPriceTotal = 0
    const validCartItems = []
    
    for (const item of cart) {
      const product = await db.prepare("SELECT id, price, stock, store_id FROM products WHERE id = ?").bind(item.id).first()
      if (!product || product.stock < item.quantity) {
        return c.redirect('/checkout?err=invalid_stock')
      }
      
      // PERBAIKAN 3: Pastikan operasi matematis tidak tercampur dengan tipe String
      const productPrice = Number(product.price || 0)
      const itemQty = Number(item.quantity || 1)

      itemsPriceTotal += (productPrice * itemQty)
      validCartItems.push({ 
        id: product.id, 
        quantity: itemQty, 
        price: productPrice, 
        store_id: product.store_id 
      })
    }

    // Jika harga produk tetap 0, berarti terjadi anomali database produk. Batalkan checkout.
    if (itemsPriceTotal === 0) {
      return c.redirect('/checkout?err=system_error')
    }

    const settings = await db.prepare("SELECT admin_fee_value FROM platform_settings WHERE id = 1").first()
    const adminFee = settings ? Number(settings.admin_fee_value || 2500) : 2500
    const totalShippingFee = 15000 
    
    // Operasi matematika dijamin akurat sekarang
    const grandTotal = itemsPriceTotal + totalShippingFee + adminFee

    const orderId = 'ORD-' + generateId().substring(0, 10).toUpperCase()

    // Transaksi Database (Aman)
    await db.batch([
      db.prepare(`INSERT INTO orders (id, user_id, status, total_items_price, total_shipping_fee, admin_fee, grand_total, shipping_address, payment_method) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`).bind(orderId, user.id, itemsPriceTotal, totalShippingFee, adminFee, grandTotal, address, paymentMethod),
      ...validCartItems.map(item => 
        db.prepare(`INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)`).bind(generateId(), orderId, item.id, item.quantity, item.price)
      )
    ])

    return c.redirect(`/checkout/success?order_id=${orderId}`)

  } catch (err) {
    console.error("Checkout Error:", err);
    return c.redirect('/checkout?err=system_error')
  }
})
