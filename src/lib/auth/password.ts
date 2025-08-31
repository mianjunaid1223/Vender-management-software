import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password using bcrypt.
 * @param password The plain-text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Could not hash password.');
  }
}

/**
 * Compares a plain-text password with a hashed password using bcrypt.
 * @param plainPassword The plain-text password to compare.
 * @param hash The hashed password to compare against.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hash);
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    // In case of an error, always return false for security reasons.
    return false;
  }
}
