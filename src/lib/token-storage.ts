const TOKEN_STORAGE_KEY = "jalurbis_auth_token";

export interface StoredToken {
  token: string;
  exp: number;
}

/**
 * Retrieve token from localStorage and validate it"s not expired
 * Returns null if token doesn"t exist or is expired
 */
export function getStoredToken(): StoredToken | null {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredToken = JSON.parse(stored);

    // Validate token structure
    if (!parsed.token || !parsed.exp) return null;

    // Check if token is expired (with 60 second buffer)
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp - now <= 60) {
      // Token is expired or about to expire, clear it
      clearStoredToken();
      return null;
    }

    return parsed;
  } catch (error) {
    // Invalid JSON or other error, clear storage
    clearStoredToken();
    return null;
  }
}

/**
 * Save token to localStorage
 */
export function setStoredToken(token: StoredToken): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  } catch (error) {
    console.error("Failed to save token to localStorage:", error);
  }
}

/**
 * Remove token from localStorage
 */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear token from localStorage:", error);
  }
}
