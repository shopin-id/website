import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// PERBAIKAN: Wajib ambil dari Env, tidak boleh ada Fallback (Cadangan) teks biasa!
const getSecret = (c: any) => {
  if (!c.env?.JWT_SECRET) {
    throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing!");
  }
  return c.env.JWT_SECRET;
};

export const createToken = async (c: any, payload: any) => {
  // Eksplisit menggunakan algoritma HS256
  return await sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getSecret(c), 'HS256');
};

export const verifyToken = async (c: any, token: string) => {
  try {
    // Eksplisit memverifikasi dengan algoritma HS256
    return await verify(token, getSecret(c), 'HS256');
  } catch (e) {
    return null;
  }
};

export const setAuthCookie = (c: any, token: string) => {
  setCookie(c, 'auth_token', token, { path: '/', httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7 });
};

export const getAuthUser = async (c: any) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return null;
  return await verifyToken(c, token);
};

export const logoutUser = (c: any) => {
  deleteCookie(c, 'auth_token', { path: '/' });
};

// Hashing menggunakan PBKDF2 WebCrypto (Tetap dipertahankan karena sudah sangat aman)
export const hashPassword = async (password: string, saltString: string = 'ShopinId_Global_Salt') => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const salt = encoder.encode(saltString);
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
