import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getSecretKey() {
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY is not defined or is not a 64-character hex string. Please check your .env.local file.');
  }
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
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
    const [ivHex, authTagHex, encryptedHex] = token.split('.');
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid token format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid or corrupted token');
  }
}
