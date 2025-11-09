/**
 * Lightens a hex color by mixing it with white
 * @param color - Hex color string (e.g., "#FF5733" or "FF5733")
 * @param amount - Amount to lighten (0-1, where 1 is full white)
 * @returns Lightened hex color
 */
export function lightenColor(color: string, amount: number): string {
	// Remove # if present
	const hex = color.replace("#", "");

	// Parse RGB components
	const r = Number.parseInt(hex.substring(0, 2), 16);
	const g = Number.parseInt(hex.substring(2, 4), 16);
	const b = Number.parseInt(hex.substring(4, 6), 16);

	// Mix with white (255, 255, 255)
	const newR = Math.round(r + (255 - r) * amount);
	const newG = Math.round(g + (255 - g) * amount);
	const newB = Math.round(b + (255 - b) * amount);

	// Convert back to hex
	const toHex = (n: number) => {
		const hex = n.toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};

	return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
