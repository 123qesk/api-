/**
 * Standard Web Crypto API (AES-GCM 256-bit + PBKDF2)
 * Ensures robust client-side encryption for API credentials.
 */

// Convert ArrayBuffer or Uint8Array to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Derive AES-GCM Key using PBKDF2
export async function deriveKey(password: string, saltBuffer: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute password verifier hash to validate master password
export async function createPasswordVerifier(password: string, saltBase64?: string): Promise<{ verifier: string; salt: string }> {
  const salt = saltBase64 ? new Uint8Array(base64ToBuffer(saltBase64)) : window.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const key = await deriveKey(password, salt);
  
  // Encrypt a known magic string
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode('KEYVAULT_VALID_PASS_V1')
  );

  const combined = {
    iv: bufferToBase64(iv),
    cipher: bufferToBase64(ciphertext),
  };

  return {
    verifier: JSON.stringify(combined),
    salt: bufferToBase64(salt),
  };
}

// Verify master password
export async function verifyPassword(password: string, verifierString: string, saltBase64: string): Promise<boolean> {
  try {
    const { iv, cipher } = JSON.parse(verifierString);
    const salt = new Uint8Array(base64ToBuffer(saltBase64));
    const key = await deriveKey(password, salt);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(iv)) },
      key,
      base64ToBuffer(cipher)
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted) === 'KEYVAULT_VALID_PASS_V1';
  } catch {
    return false;
  }
}

// Encrypt plaintext with password
export async function encryptText(plaintext: string, password: string): Promise<{ cipher: string; iv: string; salt: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    cipher: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

// Decrypt ciphertext with password
export async function decryptText(cipherBase64: string, ivBase64: string, saltBase64: string, password: string): Promise<string> {
  const salt = new Uint8Array(base64ToBuffer(saltBase64));
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const key = await deriveKey(password, salt);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBuffer(cipherBase64)
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// Mask API key for secure display (e.g., sk-1234••••••••••••••••abcd)
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}
