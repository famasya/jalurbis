import { decode } from "@googlemaps/polyline-codec";
import { useQuery } from "@tanstack/react-query";
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
import { socketTokenHooks, tokenHooks } from "~/hooks/token-hooks";
import { useSocketIO } from "~/hooks/use-socket-io";
import { findInitialRoutes } from "~/server/find-routes";
import { getCorridor } from "~/server/get-corridor";
import { getRoutesCorridor } from "~/server/get-routes-corridor";
import { getTrans } from "~/server/get-trans";
import type { Vehicle } from "~/types/map";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/_layout/$code/$slug")({
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
	const { data: transData } = useQuery({
		queryKey: ["trans-data", token],
		queryFn: async () => {
			if (!token) return null;
			const trans = await getTrans({
				data: {
					token,
				},
			});
			return trans;
		},
		enabled: !!token,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

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
	} = useQuery({
		queryKey: ["corridor", token, trans, code],
		queryFn: async () => {
			if (!token || !trans || !code) return null;
			const corridor = await getCorridor({
				data: {
					token,
					trans,
					code,
				},
			});
			return corridor;
		},
		enabled: !!token && !!trans && !!code,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	// Find selected corridor early so we can derive route from it
	const selectedCorridor = useMemo(() => {
		if (!corridorParam || !corridors) return null;
		return corridors.find((c) => c.corridor === corridorParam) || null;
	}, [corridorParam, corridors]);

	// Derive route from trans data, search param, or selected corridor
	// Priority: trans data > selected corridor
	// This allows direct URLs to work without route search param
	const effectiveRoute = useMemo(() => {
		return selectedTrans?.route || selectedCorridor?.route;
	}, [selectedTrans, selectedCorridor]);

	// Fetch initial vehicle position data
	const { data: vehiclesResponse, isLoading: isVehiclesLoading } = useQuery({
		queryKey: ["position", effectiveRoute, socketToken],
		queryFn: async () => {
			if (!effectiveRoute || !socketToken || !corridors) return null;
			const initialRoutes = await findInitialRoutes({
				data: {
					route: effectiveRoute,
					token: socketToken,
				},
			});

			// return only routes that match with corridors" `kor`
			if (!initialRoutes || !initialRoutes.data || !corridors) return [];
			const routes = initialRoutes.data.filter((route) =>
				corridors.some((corridor) => corridor.kor === route.kor),
			);
			return routes;
		},
		enabled: !!effectiveRoute && !!socketToken && !!corridors,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	// Initialize vehicles state when API data is loaded
	useEffect(() => {
		if (vehiclesResponse) {
			setVehicles(vehiclesResponse);
		}
	}, [vehiclesResponse]);

	// Fetch shelters when corridor is selected
	const { data: sheltersResponse } = useQuery({
		queryKey: ["shelters", token, corridorParam],
		queryFn: async () => {
			if (!token || !corridorParam) return null;
			const shelters = await getRoutesCorridor({
				data: {
					token,
					corridor: corridorParam,
				},
			});
			return shelters;
		},
		enabled: !!token && !!corridorParam,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

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
