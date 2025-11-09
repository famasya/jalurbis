import { env } from "cloudflare:workers";
import { createCipheriv, createDecipheriv } from "node:crypto";

/**
 * Encrypt plaintext using AES-256-CBC
 * Same input always gives same output (uses fixed IV from SECRET_KEY)
 *
 * This mirrors the Python implementation:
 * - Uses SECRET_KEY as both the encryption key and IV derivation
 * - IV is first 16 characters of SECRET_KEY
 * - Uses AES-256-CBC mode
 * - Automatically handles PKCS7 padding
 * - Returns base64-encoded encrypted data
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encrypt(plaintext: string): string {
	try {
		// Prepare key and IV (must match the Python implementation)
		const key = Buffer.from(env.SECRET_KEY_PTIS, "utf-8");
		const iv = Buffer.from(env.SECRET_KEY_PTIS.slice(0, 16), "utf-8");

		// Create cipher with AES-256-CBC mode
		const cipher = createCipheriv("aes-256-cbc", key, iv);
		cipher.setAutoPadding(true); // Enable PKCS7 padding (default behavior)

		// Encrypt the plaintext
		let encrypted = cipher.update(plaintext, "utf-8");
		encrypted = Buffer.concat([encrypted, cipher.final()]);

		// Return base64-encoded result
		return encrypted.toString("base64");
	} catch (error) {
		console.error("Error encrypting data:", error);
		throw new Error("Failed to encrypt data");
	}
}

/**
 * Decrypt base64-encoded ciphertext using AES-256-CBC
 * This is the inverse of the encrypt function
 *
 * @param ciphertext - Base64-encoded encrypted string
 * @returns Decrypted plaintext string
 */
export function decrypt(ciphertext: string): string {
	try {
		// Decode base64
		const decoded = Buffer.from(ciphertext, "base64");

		// Prepare key and IV
		const key = Buffer.from(env.SECRET_KEY_PTIS, "utf-8");
		const iv = Buffer.from(env.SECRET_KEY_PTIS.slice(0, 16), "utf-8");

		// Create decipher with AES-256-CBC mode
		const decipher = createDecipheriv("aes-256-cbc", key, iv);
		decipher.setAutoPadding(true); // Handle PKCS7 unpadding

		// Decrypt the data
		let decrypted = decipher.update(decoded);
		decrypted = Buffer.concat([decrypted, decipher.final()]);

		// Return as UTF-8 string
		return decrypted.toString("utf-8");
	} catch (error) {
		console.error("Error decrypting data:", error);
		throw new Error("Failed to decrypt data");
	}
}
