/**
 * Check if a token is expired or about to expire (within 60 seconds)
 */
export function isTokenExpired(
	exp: number,
	bufferSeconds: number = 60,
): boolean {
	const now = Math.floor(Date.now() / 1000);
	return exp - now <= bufferSeconds;
}

/**
 * Get time until token expiry in seconds
 */
export function getTimeUntilExpiry(exp: number): number {
	const now = Math.floor(Date.now() / 1000);
	return Math.max(0, exp - now);
}

/**
 * Calculate optimal refresh interval based on time until expiry
 * Returns false to disable interval, or milliseconds for next check
 */
export function getRefreshInterval(exp: number | undefined): number | false {
	if (!exp) return false;

	const timeUntilExpiry = getTimeUntilExpiry(exp);

	// If expired or about to expire (< 60s), refresh immediately (every second)
	if (timeUntilExpiry <= 60) return 1000;

	// If less than 5 minutes remain, check every 30 seconds
	if (timeUntilExpiry <= 300) return 30000;

	// If less than 15 minutes remain, check every minute
	if (timeUntilExpiry <= 900) return 60000;

	// Otherwise check every 5 minutes
	return 300000;
}

/**
 * Format expiry timestamp to human-readable string
 */
export function formatExpiry(exp: number): string {
	const timeUntilExpiry = getTimeUntilExpiry(exp);

	if (timeUntilExpiry <= 0) return "Expired";

	const minutes = Math.floor(timeUntilExpiry / 60);
	const seconds = timeUntilExpiry % 60;

	if (minutes === 0) return `${seconds}s`;
	if (seconds === 0) return `${minutes}m`;
	return `${minutes}m ${seconds}s`;
}
