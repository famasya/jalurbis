import { useEffect, useState, useMemo } from "react";
import { useVehiclePolling } from "./useVehiclePolling";
import type { Vehicle } from "~/types/map";

export interface UseVehicleUpdatesOptions {
	/**
	 * Initial vehicle data from REST API
	 */
	initialVehicles?: Vehicle[];

	/**
	 * Authentication token for GPS API
	 */
	token?: string;

	/**
	 * Encrypted route payload for polling
	 */
	route?: string;

	/**
	 * Enable real-time updates (polling)
	 */
	enabled?: boolean;

	/**
	 * Filter vehicles by corridor code (pref)
	 */
	corridorFilter?: string;

	/**
	 * Polling interval in milliseconds
	 * Default: 10000 (10 seconds)
	 */
	pollingInterval?: number;
}

export interface UseVehicleUpdatesReturn {
	/**
	 * Current vehicle positions
	 */
	vehicles: Vehicle[];

	/**
	 * Whether actively receiving data
	 */
	isActive: boolean;

	/**
	 * Last update timestamp
	 */
	lastUpdate: Date | null;

	/**
	 * Error if any
	 */
	error: Error | null;
}

/**
 * Vehicle state manager hook using REST API polling
 *
 * Features:
 * - Polls GPS API at regular intervals for vehicle updates
 * - Merges initial data with polling updates
 * - Filters vehicles by corridor
 *
 * @param options Configuration options
 * @returns Vehicle data and polling state
 */
export function useVehicleUpdates(
	options: UseVehicleUpdatesOptions,
): UseVehicleUpdatesReturn {
	const {
		initialVehicles = [],
		token,
		route,
		enabled = true,
		corridorFilter,
		pollingInterval = 10000,
	} = options;

	// State for vehicle data
	const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

	/**
	 * Polling for vehicle updates
	 */
	const polling = useVehiclePolling({
		route,
		token,
		enabled,
		interval: pollingInterval,
		onData: (vehicleData) => {
			setVehicles(vehicleData);
		},
		onError: (error) => {
			console.error("Polling error:", error);
		},
	});

	/**
	 * Initialize with initial vehicles
	 */
	useEffect(() => {
		if (initialVehicles.length > 0) {
			setVehicles(initialVehicles);
		}
	}, [initialVehicles]);

	/**
	 * Filter vehicles by corridor if specified
	 */
	const filteredVehicles = useMemo(() => {
		if (!corridorFilter) {
			return vehicles;
		}

		return vehicles.filter((v) => v.pref === corridorFilter);
	}, [vehicles, corridorFilter]);

	return {
		vehicles: filteredVehicles,
		isActive: polling.isPolling,
		lastUpdate: polling.lastUpdate,
		error: polling.error,
	};
}
