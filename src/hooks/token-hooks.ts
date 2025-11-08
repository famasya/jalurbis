import { useQuery } from "@tanstack/react-query";
import { getRefreshInterval } from "~/lib/token-helpers";
import { getStoredToken, setStoredToken } from "~/lib/token-storage";
import { getToken } from "~/server/get-token";

export const tokenHooks = () => {
  const { data: tokenData, isLoading, isRefetching } = useQuery({
    queryKey: ["token"],
    queryFn: async () => {
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
    },
    // Automatically refresh token based on expiry time
    refetchInterval: (query) => {
      return getRefreshInterval(query.state.data?.exp);
    },
    // Keep token fresh in cache
    staleTime: 0,
    // Refetch when window regains focus to ensure token is fresh
    refetchOnWindowFocus: true,
  });

  return { token: tokenData?.token, expired: tokenData?.exp, isLoading, isRefetching };
}
