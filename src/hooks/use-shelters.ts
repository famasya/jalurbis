import { useQuery } from "@tanstack/react-query";
import { getRoutesCorridor } from "~/server/get-routes-corridor";

// Query key factory
export const sheltersKeys = {
	all: ["shelters"] as const,
	byParams: (token: string, corridor: string) =>
		["shelters", token, corridor] as const,
};

// Query options factory
export const sheltersQueryOptions = (
	token: string | undefined,
	corridor: string | undefined,
) => ({
	queryKey: sheltersKeys.byParams(token || "", corridor || ""),
	queryFn: async () => {
		if (!token || !corridor) return null;
		return await getRoutesCorridor({ data: { token, corridor } });
	},
	enabled: !!token && !!corridor,
	retry: 3,
	retryDelay: (attemptIndex: number) =>
		Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Hook for components
export const useShelters = (
	token: string | undefined,
	corridor: string | undefined,
) => {
	return useQuery(sheltersQueryOptions(token, corridor));
};
