import { useEffect, useRef, useState, useCallback } from "react";
import { findInitialRoutes } from "~/server/find-routes";
import type { Vehicle } from "~/types/map";

export interface UseVehiclePollingOptions {
	route?: string;
	token?: string;
	enabled?: boolean;
	interval?: number; // in milliseconds, default 10000 (10 seconds)
	onData?: (vehicles: Vehicle[]) => void;
	onError?: (error: Error) => void;
}

export interface UseVehiclePollingReturn {
	vehicles: Vehicle[];
	isPolling: boolean;
	error: Error | null;
	lastUpdate: Date | null;
}

/**
 * Fallback polling mechanism for vehicle positions
 *
 * Uses REST API polling when WebSocket connection fails.
 * Polls at configurable intervals (default 10 seconds).
 *
 * @param options Configuration options
 * @returns Polling state and vehicle data
 */
export function useVehiclePolling(
	options: UseVehiclePollingOptions,
): UseVehiclePollingReturn {
	const {
		route,
		token,
		enabled = false,
		interval = 10000,
		onData,
		onError,
	} = options;

	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [isPolling, setIsPolling] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const isMountedRef = useRef(true);

	/**
	 * Fetch vehicle data from REST API
	 */
	const fetchVehicles = useCallback(async () => {
		if (!route || !token) {
			return;
		}

		try {
			setIsPolling(true);
			setError(null);

			const response = await findInitialRoutes({
				data: {
					route,
					token,
				},
			});

			if (isMountedRef.current) {
				const vehicleData = response?.data || [];
				setVehicles(vehicleData);
				setLastUpdate(new Date());
				onData?.(vehicleData);
			}
		} catch (err) {
			const error =
				err instanceof Error ? err : new Error("Failed to fetch vehicles");

			if (isMountedRef.current) {
				setError(error);
				onError?.(error);
			}

			console.error("Vehicle polling error:", error);
		} finally {
			if (isMountedRef.current) {
				setIsPolling(false);
			}
		}
	}, [route, token, onData, onError]);

	/**
	 * Start polling at the specified interval
	 */
	useEffect(() => {
		if (!enabled || !route || !token) {
			return;
		}

		// Fetch immediately on start
		fetchVehicles();

		// Setup polling interval
		intervalRef.current = setInterval(() => {
			fetchVehicles();
		}, interval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = undefined;
			}
		};
	}, [enabled, route, token, interval, fetchVehicles]);

	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return {
		vehicles,
		isPolling,
		error,
		lastUpdate,
	};
}
