import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  
  const user = await getAuthUser(c)
  if (!user || user.role !== 'admin') {
    return c.text('403 Forbidden: Akses Ditolak.', 403)
  }

  const formData = await c.req.formData()
  const section = formData.get('section') as string
  
  await db.prepare("INSERT OR IGNORE INTO platform_settings (id) VALUES (1)").run()

  if (section === 'general') {
    const feeType = formData.get('admin_fee_type') as string
    const feeValue = parseInt(formData.get('admin_fee_value') as string, 10) || 0
    const whatsapp = (formData.get('whatsapp_number') as string || '').trim()
    
    try { await db.prepare("ALTER TABLE platform_settings ADD COLUMN whatsapp_number TEXT").run() } catch(e) {}

    await db.prepare(`UPDATE platform_settings SET admin_fee_type = ?, admin_fee_value = ?, whatsapp_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`)
      .bind(feeType, feeValue, whatsapp).run()
  } 
  else if (section === 'banks') {
    const bankNames = formData.getAll('bank_name[]') as string[]
    const bankAccNums = formData.getAll('bank_account_number[]') as string[]
    const bankAccNames = formData.getAll('bank_account_name[]') as string[]
    
    const banks = []
    for(let i = 0; i < bankNames.length; i++) {
      if(bankNames[i]) {
        banks.push({ bank_name: bankNames[i].trim(), bank_account_number: bankAccNums[i].trim(), bank_account_name: bankAccNames[i].trim() })
      }
    }
    
    try { await db.prepare("ALTER TABLE platform_settings ADD COLUMN manual_banks_json TEXT DEFAULT '[]'").run() } catch(e) {}
    
    await db.prepare("UPDATE platform_settings SET manual_banks_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1")
      .bind(JSON.stringify(banks)).run()
  } 
  else if (section === 'cloudinary') {
    // PERBAIKAN: Gunakan .trim() untuk membuang spasi kosong tidak sengaja dari hasil copy-paste
    const cloudName = (formData.get('cloudinary_cloud_name') as string || '').trim()
    const apiKey = (formData.get('cloudinary_api_key') as string || '').trim()
    const apiSecretRaw = formData.get('cloudinary_api_secret') as string
    const apiSecret = apiSecretRaw ? apiSecretRaw.trim() : ''

    if (apiSecret !== '') {
      await db.prepare(`UPDATE platform_settings SET cloudinary_cloud_name = ?, cloudinary_api_key = ?, cloudinary_api_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`)
        .bind(cloudName, apiKey, apiSecret).run()
    } else {
      await db.prepare(`UPDATE platform_settings SET cloudinary_cloud_name = ?, cloudinary_api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`)
        .bind(cloudName, apiKey).run()
    }
  }
  else if (section === 'rajaongkir') {
    const key = (formData.get('rajaongkir_api_key') as string || '').trim()
    await db.prepare("UPDATE platform_settings SET rajaongkir_api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1").bind(key).run()
  }

  return c.redirect('/admin/settings?success=1')
})
