import { useQueries } from "@tanstack/react-query";
import type { Shelter } from "~/types/map";
import { sheltersQueryOptions } from "./use-shelters";

interface Corridor {
	corridor: string;
	kor: string;
	origin: string;
	toward: string;
	points_a: string | null;
	points_b: string | null;
}

/**
 * Hook to fetch shelters from all corridors of the selected transportation mode
 */
export const useAllShelters = (
	token: string | undefined,
	corridors: Corridor[] | undefined,
) => {
	const queries = useQueries({
		queries:
			corridors?.map((corridor) =>
				sheltersQueryOptions(token, corridor.corridor),
			) || [],
	});

	// Check if all queries are done
	const isLoading = queries.some((query) => query.isLoading);
	const isError = queries.some((query) => query.isError);

	// Combine all shelters from all corridors and flatten
	// Add the corridor.corridor value to each shelter for navigation
	const allShelters: Shelter[] = queries.flatMap((query, index) => {
		const corridor = corridors?.[index];
		const sheltersData = query.data?.data || [];

		// Add corridor value to each shelter
		return sheltersData.map((shelter) => ({
			...shelter,
			in_koridor: corridor?.corridor || shelter.in_koridor,
		}));
	});

	// Deduplicate shelters by sh_id (in case same shelter appears in multiple corridors)
	const uniqueShelters = Array.from(
		new Map(allShelters.map((shelter) => [shelter.sh_id, shelter])).values(),
	);

	return {
		data: uniqueShelters.length > 0 ? uniqueShelters : null,
		isLoading,
		isError,
	};
};
