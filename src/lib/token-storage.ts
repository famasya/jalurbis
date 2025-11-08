const TOKEN_STORAGE_KEY = "jalurbis_auth_token";

export interface StoredToken {
  token: string;
  exp: number;
}

/**
 * Retrieve token from localStorage and validate it"s not expired
 * Returns null if token doesn"t exist or is expired
 */
export function getStoredToken(key: string = TOKEN_STORAGE_KEY): StoredToken | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: StoredToken = JSON.parse(stored);

    // Validate token structure
    if (!parsed.token || !parsed.exp) return null;

    // Check if token is expired (with 60 second buffer)
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp - now <= 60) {
      // Token is expired or about to expire, clear it
      clearStoredToken(key);
      return null;
    }

    return parsed;
  } catch (error) {
    // Invalid JSON or other error, clear storage
    clearStoredToken(key);
    return null;
  }
}

/**
 * Save token to localStorage
 */
export function setStoredToken(token: StoredToken, key: string = TOKEN_STORAGE_KEY): void {
  try {
    localStorage.setItem(key, JSON.stringify(token));
  } catch (error) {
    console.error("Failed to save token to localStorage:", error);
  }
}

/**
 * Remove token from localStorage
 */
export function clearStoredToken(key: string = TOKEN_STORAGE_KEY): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear token from localStorage:", error);
  }
}
