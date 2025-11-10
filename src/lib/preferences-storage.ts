export interface UserPreferences {
	grayscaleMode: boolean;
	debugMode: boolean;
	hideVehicles: boolean;
}

const PREFERENCES_KEY = "user-preferences";

const defaultPreferences: UserPreferences = {
	grayscaleMode: true, // Default to true since CSS currently has it always on
	debugMode: false,
	hideVehicles: false,
};

export function getPreferences(): UserPreferences {
	try {
		const stored = localStorage.getItem(PREFERENCES_KEY);
		if (!stored) {
			return defaultPreferences;
		}
		const parsed = JSON.parse(stored);
		// Merge with defaults to handle cases where new preferences are added
		return { ...defaultPreferences, ...parsed };
	} catch (error) {
		console.error("Error reading preferences from localStorage:", error);
		return defaultPreferences;
	}
}

export function setPreferences(preferences: UserPreferences): void {
	try {
		localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
	} catch (error) {
		console.error("Error saving preferences to localStorage:", error);
	}
}

export function clearPreferences(): void {
	try {
		localStorage.removeItem(PREFERENCES_KEY);
	} catch (error) {
		console.error("Error clearing preferences from localStorage:", error);
	}
}
