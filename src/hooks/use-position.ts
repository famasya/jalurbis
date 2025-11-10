import { useQuery } from "@tanstack/react-query";
import { findInitialRoutes } from "~/server/find-routes";

// Query key factory
export const positionKeys = {
	all: ["position"] as const,
	byRoute: (route: string, socketToken: string) =>
		["position", route, socketToken] as const,
};

// Query options factory
export const positionQueryOptions = (
	route: string | undefined,
	socketToken: string | undefined,
	corridors: Array<{ kor: string }> | null | undefined,
) => ({
	queryKey: positionKeys.byRoute(route || "", socketToken || ""),
	queryFn: async () => {
		if (!route || !socketToken || !corridors) return null;
		const initialRoutes = await findInitialRoutes({
			data: { route, token: socketToken },
		});

		// return only routes that match with corridors' `kor`
		if (!initialRoutes || !initialRoutes.data || !corridors) return [];
		const routes = initialRoutes.data.filter((routeItem) =>
			corridors.some((corridor) => corridor.kor === routeItem.kor),
		);
		return routes;
	},
	enabled: !!route && !!socketToken && !!corridors,
	retry: 3,
	retryDelay: (attemptIndex: number) =>
		Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Hook for components
export const usePosition = (
	route: string | undefined,
	socketToken: string | undefined,
	corridors: Array<{ kor: string }> | null | undefined,
) => {
	return useQuery(positionQueryOptions(route, socketToken, corridors));
};
