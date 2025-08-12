import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;



function getSecretKey() {
  let encryptionKey = process.env.ENCRYPTION_KEY;
  
  // If no encryption key is set, use a deterministic fallback for development
  if (!encryptionKey) {
    console.warn('⚠️  ENCRYPTION_KEY not found in environment variables. Using development fallback...');
    console.warn('⚠️  For production, add this to your .env.local file:');
    // Use a deterministic key based on NODE_ENV to ensure consistency in development
    const fallbackSeed = process.env.NODE_ENV === 'production' 
      ? 'CHANGE_THIS_IN_PRODUCTION_' + Date.now() 
      : 'development_fallback_key_vendor_management_system_2024';
    encryptionKey = crypto.createHash('sha256').update(fallbackSeed).digest('hex');
    console.warn(`ENCRYPTION_KEY=${encryptionKey}`);
  }
  
  if (encryptionKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string. Please check your .env.local file.');
  }
  
  return Buffer.from(encryptionKey, 'hex');
}

export function encrypt(text: string) {
  const secretKey = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted.toString('hex')}`;
}

export function decrypt(token: string) {
  try {
    const secretKey = getSecretKey();
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Invalid token format - expected 3 parts separated by dots');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid token format - missing parts');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Validate buffer lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    console.error('Token format:', token?.substring(0, 50) + '...');
    throw new Error(`Invalid or corrupted token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
