import bcrypt from "bcryptjs";

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values are more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns true if passwords match, false otherwise
 * @throws Error if comparison fails
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error(`Failed to compare password: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Validate password strength
 * Password must be at least 8 characters long
 * @param password - Password to validate
 * @returns true if password meets requirements, false otherwise
 */
export function validatePasswordStrength(password: string): boolean {
  // Minimum 8 characters
  if (password.length < 8) {
    return false;
  }

  // Add more validation rules as needed:
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character

  return true;
}

/**
 * Get password strength error message
 * @returns Error message describing password requirements
 */
export function getPasswordRequirements(): string {
  return "Password must be at least 8 characters long";
}
