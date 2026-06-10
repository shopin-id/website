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
  
  if (!cartDataRaw) {
    // Pastikan selalu ada return di setiap cabang
    return c.redirect('/checkout?err=empty_cart')
  }

  try {
    const cart = JSON.parse(cartDataRaw)
    
    let itemsPriceTotal = 0
    const validCartItems = []
    
    for (const item of cart) {
      const product = await db.prepare("SELECT id, price, stock, store_id FROM products WHERE id = ?").bind(item.id).first()
      if (!product || product.stock < item.quantity) {
        return c.redirect('/checkout?err=invalid_stock')
      }
      
      itemsPriceTotal += (product.price * item.quantity)
      validCartItems.push({ 
        id: product.id, 
        quantity: item.quantity, 
        price: product.price, 
        store_id: product.store_id 
      })
    }

    const settings = await db.prepare("SELECT admin_fee_value FROM platform_settings WHERE id = 1").first()
    const adminFee = settings ? (settings.admin_fee_value as number) : 2500
    const totalShippingFee = 15000 
    const grandTotal = itemsPriceTotal + totalShippingFee + adminFee

    const orderId = 'ORD-' + generateId().substring(0, 10).toUpperCase()

    // Transaksi Database untuk memastikan data konsisten
    await db.batch([
      db.prepare(`INSERT INTO orders (id, user_id, status, total_items_price, total_shipping_fee, admin_fee, grand_total, shipping_address, payment_method) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`).bind(orderId, user.id, itemsPriceTotal, totalShippingFee, adminFee, grandTotal, address, paymentMethod),
      ...validCartItems.map(item => 
        db.prepare(`INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)`).bind(generateId(), orderId, item.id, item.quantity, item.price)
      )
    ])

    // Redirect setelah sukses
    return c.redirect(`/checkout/success?order_id=${orderId}`)

  } catch (err) {
    console.error("Checkout Error:", err);
    // Jika JSON.parse gagal atau DB gagal, tetap harus kembalikan response
    return c.redirect('/checkout?err=system_error')
  }
})
