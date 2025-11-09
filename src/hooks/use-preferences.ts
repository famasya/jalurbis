import { useEffect, useState } from "react";
import type { UserPreferences } from "~/lib/preferences-storage";
import { getPreferences, setPreferences } from "~/lib/preferences-storage";

export function usePreferences() {
	const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
		// Initialize from localStorage on mount (client-side only)
		if (typeof window !== "undefined") {
			return getPreferences();
		}
		return { grayscaleMode: true }; // SSR fallback
	});

	// Apply grayscale class to document when preference changes
	useEffect(() => {
		if (typeof window === "undefined") return;

		const htmlElement = document.documentElement;
		if (preferences.grayscaleMode) {
			htmlElement.classList.add("map-grayscale-mode");
		} else {
			htmlElement.classList.remove("map-grayscale-mode");
		}
	}, [preferences.grayscaleMode]);

	const updatePreferences = (updates: Partial<UserPreferences>) => {
		const newPreferences = { ...preferences, ...updates };
		setPreferencesState(newPreferences);
		setPreferences(newPreferences); // Save to localStorage
	};

	const toggleGrayscale = () => {
		updatePreferences({ grayscaleMode: !preferences.grayscaleMode });
	};

	return {
		preferences,
		updatePreferences,
		toggleGrayscale,
	};
}
