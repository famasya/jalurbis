import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getCorridor } from "~/server/get-corridor";

// Query key factory
export const corridorKeys = {
	all: ["corridor"] as const,
	byParams: (token: string, trans: string, code: string) =>
		["corridor", token, trans, code] as const,
};

// Query options factory
export const corridorQueryOptions = (
	token: string | undefined,
	trans: string | undefined,
	code: string | undefined,
) => ({
	queryKey: corridorKeys.byParams(token || "", trans || "", code || ""),
	queryFn: async () => {
		if (!token || !trans || !code) return null;
		return await getCorridor({ data: { token, trans, code } });
	},
	enabled: !!token && !!trans && !!code,
	retry: 3,
	retryDelay: (attemptIndex: number) =>
		Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Hook for components
export const useCorridor = (
	token: string | undefined,
	trans: string | undefined,
	code: string | undefined,
) => {
	return useQuery(corridorQueryOptions(token, trans, code));
};

// Prefetch function for loaders
export const prefetchCorridor = async (
	queryClient: QueryClient,
	token: string,
	trans: string,
	code: string,
) => {
	return await queryClient.ensureQueryData({
		queryKey: corridorKeys.byParams(token, trans, code),
		queryFn: async () => await getCorridor({ data: { token, trans, code } }),
	});
};
