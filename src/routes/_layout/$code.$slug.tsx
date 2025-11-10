import { decode } from "@googlemaps/polyline-codec";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import z from "zod";
import BottomNavbar from "~/components/bottom-navbar";
import ClientOnlyMap from "~/components/map/client-only-map";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { prefetchCorridor, useCorridor } from "~/hooks/use-corridor";
import { usePosition } from "~/hooks/use-position";
import { useShelters } from "~/hooks/use-shelters";
import { useSocketIO } from "~/hooks/use-socket-io";
import {
	prefetchToken,
	socketTokenHooks,
	tokenHooks,
} from "~/hooks/token-hooks";
import { prefetchTransData, useTransData } from "~/hooks/use-trans-data";
import type { Vehicle } from "~/types/map";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/_layout/$code/$slug")({
	loader: async ({ preload, context, params }) => {
		if (!preload) return undefined;

		const { queryClient } = context;
		const { code } = params;

		// Prefetch token using shared hook logic
		const tokenData = await prefetchToken(queryClient);
		const token = tokenData?.token;
		if (!token) throw new Error("No authentication token");

		// Prefetch trans-data using shared hook logic
		const transData = await prefetchTransData(queryClient, token);

		// Find trans value for corridor query
		const selectedTrans = transData?.find((t) => t.pref === code);
		const trans = selectedTrans?.trans;

		if (trans) {
			// Prefetch corridor data using shared hook logic
			await prefetchCorridor(queryClient, token, trans, code);
		}

		return undefined;
	},
	head: ({ params }) => ({
		meta: [
			...seo({
				title: `JalurBis - Jalur ${params.slug.replaceAll("-", " ")}`,
			}),
		],
	}),
	params: {
		parse: (params) => ({
			code: z.string().parse(params.code),
			slug: z.string().parse(params.slug),
		}),
	},
	validateSearch: z
		.object({
			corridor: z.string().optional(),
		})
		.catch({
			corridor: undefined,
		}),
	component: RouteComponent,
});

function RouteComponent() {
	const { code } = Route.useParams();
	const { corridor: corridorParam } = useSearch({
		from: "/_layout/$code/$slug",
	});
	const { token } = tokenHooks();
	const { socketToken } = socketTokenHooks();
	const navigate = useNavigate({ from: "/$code/$slug" });

	// State to manage vehicles array (initialized from API, updated by socket)
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);

	// Fetch transportation modes data
	const { data: transData } = useTransData(token);

	// Find the selected transportation mode to get its lat/lng/zoom
	const selectedTrans = transData?.find((t) => t.pref === code);

	// Derive trans from code (needed for corridor API)
	const trans = selectedTrans?.trans;

	// Parse lat/lng/zoom from the selected transportation
	const mapCenter: [number, number] = selectedTrans
		? [parseFloat(selectedTrans.lat), parseFloat(selectedTrans.lng)]
		: [-7.2575, 112.7521]; // Default to Surabaya

	const mapZoom = selectedTrans ? Number.parseInt(selectedTrans.zoom, 10) : 12;

	// Callback to handle real-time vehicle updates from Socket.IO
	const handleVehicleUpdate = useCallback((updatedVehicle: Vehicle) => {
		setVehicles((prevVehicles) => {
			// Find the index of the vehicle with matching IMEI
			const existingIndex = prevVehicles.findIndex(
				(v) => v.imei === updatedVehicle.imei,
			);

			if (existingIndex !== -1) {
				// Update existing vehicle only if it"s already in our filtered list
				const newVehicles = [...prevVehicles];
				newVehicles[existingIndex] = updatedVehicle;
				return newVehicles;
			}

			// Don"t add new vehicles - only update vehicles from initial filtered set
			return prevVehicles;
		});
	}, []);

	// Connect to Socket.IO with vehicle update callback
	useSocketIO({
		onVehicleUpdate: handleVehicleUpdate,
	});

	// Fetch corridor data
	const {
		data: corridors,
		isLoading: isCorridorsLoading,
		isPending: isCorridorsPending,
	} = useCorridor(token, trans, code);

	// Find selected corridor early so we can derive route from it
	const selectedCorridor = useMemo(() => {
		if (!corridorParam || !corridors) return null;
		return corridors.find((c) => c.corridor === corridorParam) || null;
	}, [corridorParam, corridors]);

	// Derive route from trans data, search param, or selected corridor
	// Priority: trans data > selected corridor
	// This allows direct URLs to work without route search param
	const selectedRouteDetail = useMemo(() => {
		return selectedTrans?.route || selectedCorridor?.route;
	}, [selectedTrans, selectedCorridor]);

	// Fetch initial vehicle position data
	const { data: vehiclesResponse, isLoading: isVehiclesLoading } = usePosition(
		selectedRouteDetail,
		socketToken,
		corridors,
	);

	// Initialize vehicles state when API data is loaded
	useEffect(() => {
		if (vehiclesResponse) {
			setVehicles(vehiclesResponse);
		}
	}, [vehiclesResponse]);

	// Fetch shelters when corridor is selected
	const { data: sheltersResponse } = useShelters(token, corridorParam);

	// Calculate corridor center from polyline points
	const corridorCenter = useMemo((): [number, number] | undefined => {
		if (!selectedCorridor) return undefined;

		try {
			// Decode the polyline points
			const points = selectedCorridor.points_a
				? decode(selectedCorridor.points_a)
				: [];

			if (points.length === 0) return undefined;

			// Calculate the center point (average of all coordinates)
			const latSum = points.reduce((sum, point) => sum + point[0], 0);
			const lngSum = points.reduce((sum, point) => sum + point[1], 0);

			return [latSum / points.length, lngSum / points.length];
		} catch (error) {
			console.error("Error calculating corridor center:", error);
			return undefined;
		}
	}, [selectedCorridor]);

	// Filter corridors: show only selected corridor if one is selected
	const filteredCorridors = useMemo(() => {
		if (!corridors) return [];
		if (!selectedCorridor) return corridors;
		return corridors.filter((c) => c.id === selectedCorridor.id);
	}, [corridors, selectedCorridor]);

	// Filter vehicles: show only vehicles matching selected corridor"s kor
	const filteredVehicles = useMemo(() => {
		if (!selectedCorridor) return vehicles;
		return vehicles.filter((v) => v.kor === selectedCorridor.kor);
	}, [vehicles, selectedCorridor]);

	// Clear corridor selection
	const handleClearSelection = useCallback(() => {
		navigate({
			search: (prev) => ({
				...prev,
				corridor: undefined,
			}),
		});
	}, [navigate]);

	// Show loading state
	if (
		isCorridorsLoading ||
		isVehiclesLoading ||
		isCorridorsPending ||
		isCorridorsLoading
	) {
		return (
			<div className="h-dvh w-full flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// Show empty state if no data
	if (
		(!corridors || corridors.length === 0) &&
		!isCorridorsLoading &&
		!isCorridorsPending
	) {
		return (
			<div className="h-dvh w-full flex items-center justify-center text-gray-500">
				<p>Select a transportation mode to view routes</p>
			</div>
		);
	}

	return (
		<div className="h-dvh w-full relative">
			{selectedCorridor && (
				<Button
					onClick={handleClearSelection}
					className="absolute top-4 rounded-full right-4 z-[1000]"
				>
					<X />
					Clear Corridor
				</Button>
			)}
			<ClientOnlyMap
				corridors={filteredCorridors}
				vehicles={filteredVehicles}
				shelters={sheltersResponse?.data || []}
				selectedCorridorId={selectedCorridor?.id || null}
				center={corridorCenter || mapCenter}
				zoom={corridorCenter ? 12 : mapZoom}
			/>
			<BottomNavbar />
		</div>
	);
}
