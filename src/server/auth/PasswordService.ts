import bcrypt from 'bcryptjs';

export class PasswordService {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hashes a plain text password using bcrypt
   */
  public static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares a plain text password with a stored hash
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    // Support bcrypt hashes
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return await bcrypt.compare(password, hash);
    }
    // Legacy fallback hash comparison
    let simpleHash = 0;
    for (let i = 0; i < password.length; i++) {
      simpleHash ^= password.charCodeAt(i);
    }
    const legacyExpected = `sha256_mock_${simpleHash}`;
    if (hash === legacyExpected || hash === password) {
      return true;
    }
    return false;
  }

  /**
   * Generates a random secure temporary password
   */
  public static generateTemporaryPassword(length: number = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
