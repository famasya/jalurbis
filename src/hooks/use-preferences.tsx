import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import type { UserPreferences } from "~/lib/preferences-storage";
import { getPreferences, setPreferences } from "~/lib/preferences-storage";

interface PreferencesContextType {
	preferences: UserPreferences;
	updatePreferences: (updates: Partial<UserPreferences>) => void;
	toggleGrayscale: () => void;
	toggleDebugMode: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
	undefined,
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
	const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
		// Initialize from localStorage on mount (client-side only)
		if (typeof window !== "undefined") {
			return getPreferences();
		}
		return { grayscaleMode: true, debugMode: false }; // SSR fallback
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

	const toggleDebugMode = () => {
		updatePreferences({ debugMode: !preferences.debugMode });
	};

	const value = {
		preferences,
		updatePreferences,
		toggleGrayscale,
		toggleDebugMode,
	};

	return (
		<PreferencesContext.Provider value={value}>
			{children}
		</PreferencesContext.Provider>
	);
}

export function usePreferences() {
	const context = useContext(PreferencesContext);
	if (context === undefined) {
		throw new Error("usePreferences must be used within a PreferencesProvider");
	}
	return context;
}
