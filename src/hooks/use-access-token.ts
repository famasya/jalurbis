import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRefreshInterval } from "~/lib/token-helpers";
import { getStoredToken, setStoredToken } from "~/lib/token-storage";
import { getSocketToken } from "~/server/get-socket-token";
import { getToken } from "~/server/get-token";

// Query key factory
export const tokenKeys = {
	token: ["token"] as const,
	socketToken: ["socket-token"] as const,
};

// Shared token queryFn
const tokenQueryFn = async () => {
	// Try to get token from localStorage first
	const stored = getStoredToken();
	if (stored) {
		return stored;
	}

	// Fetch new token from server
	const newToken = await getToken();

	// Save to localStorage
	setStoredToken(newToken);

	return newToken;
};

// Shared socket token queryFn
const socketTokenQueryFn = async () => {
	// Try to get token from localStorage first
	const stored = getStoredToken("socket-token");
	if (stored) {
		return stored;
	}

	// Fetch new token from server
	const newToken = await getSocketToken();

	// Save to localStorage
	setStoredToken(newToken, "socket-token");

	return newToken;
};

export const useAccessToken = () => {
	const {
		data: tokenData,
		isLoading,
		isRefetching,
	} = useQuery({
		queryKey: tokenKeys.token,
		queryFn: tokenQueryFn,
		// Automatically refresh token based on expiry time
		refetchInterval: (query) => {
			return getRefreshInterval(query.state.data?.exp);
		},
		// Keep token fresh in cache
		staleTime: 0,
		// Refetch when window regains focus to ensure token is fresh
		refetchOnWindowFocus: true,
	});

	return {
		token: tokenData?.token,
		expired: tokenData?.exp,
		isLoading,
		isRefetching,
	};
};

export const socketTokenHooks = () => {
	const {
		data: tokenData,
		isLoading,
		isRefetching,
	} = useQuery({
		queryKey: tokenKeys.socketToken,
		queryFn: socketTokenQueryFn,
		// Automatically refresh token based on expiry time
		refetchInterval: (query) => {
			return getRefreshInterval(query.state.data?.exp);
		},
		// Keep token fresh in cache
		staleTime: 0,
		// Refetch when window regains focus to ensure token is fresh
		refetchOnWindowFocus: true,
	});

	return {
		socketToken: tokenData?.token,
		expired: tokenData?.exp,
		isLoading,
		isRefetching,
	};
};

// Prefetch function for loaders
export const prefetchToken = async (queryClient: QueryClient) => {
	return await queryClient.ensureQueryData({
		queryKey: tokenKeys.token,
		queryFn: tokenQueryFn,
	});
};
