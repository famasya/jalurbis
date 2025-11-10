import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getTrans } from "~/server/get-trans";

// Query key factory
export const transDataKeys = {
	all: ["trans-data"] as const,
	byToken: (token: string) => ["trans-data", token] as const,
};

// Query options factory
export const transDataQueryOptions = (token: string | undefined) => ({
	queryKey: transDataKeys.byToken(token || ""),
	queryFn: async () => {
		if (!token) return null;
		return await getTrans({ data: { token } });
	},
	enabled: !!token,
	retry: 3,
	retryDelay: (attemptIndex: number) =>
		Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Hook for components
export const useTransData = (token: string | undefined) => {
	return useQuery(transDataQueryOptions(token));
};

// Prefetch function for loaders
export const prefetchTransData = async (
	queryClient: QueryClient,
	token: string,
) => {
	return await queryClient.ensureQueryData({
		queryKey: transDataKeys.byToken(token),
		queryFn: async () => await getTrans({ data: { token } }),
	});
};
