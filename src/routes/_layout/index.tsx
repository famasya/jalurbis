import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import z from "zod";
import { Spinner } from "~/components/ui/spinner";
import { socketTokenHooks, tokenHooks } from "~/hooks/token-hooks";
import { useSocketIO } from "~/hooks/use-socket-io";
import { findInitialRoutes } from "~/server/find-routes";
import { getCorridor } from "~/server/get-corridor";
import { getTrans } from "~/server/get-trans";
import type { Corridor, Vehicle } from "~/types/map";

// Client-side only map component wrapper
function ClientOnlyMap({
	corridors,
	vehicles,
	center,
	zoom,
}: {
	corridors: Corridor[];
	vehicles: Vehicle[];
	center?: [number, number];
	zoom?: number;
}) {
	const [MapComponent, setMapComponent] = useState<ComponentType<{
		corridors: Corridor[];
		vehicles: Vehicle[];
		center?: [number, number];
		zoom?: number;
	}> | null>(null);

	useEffect(() => {
		// Dynamically import map component only on client side
		import("~/components/map/transport-map").then((mod) => {
			setMapComponent(() => mod.TransportMap);
		});
	}, []);

	if (!MapComponent) {
		return (
			<div className="h-full w-full flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<MapComponent
			corridors={corridors}
			vehicles={vehicles}
			center={center}
			zoom={zoom}
		/>
	);
}

export const Route = createFileRoute("/_layout/")({
	validateSearch: z
		.object({
			trans: z.string().optional(),
			corridor: z.string().optional(),
			route: z.string().optional(),
			code: z.string().optional(),
		})
		.catch({
			trans: undefined,
			corridor: undefined,
			route: undefined,
			code: undefined,
		}),
	component: RouteComponent,
});

function RouteComponent() {
	const { trans, code, route } = useSearch({ from: "/_layout/" });
	const { token } = tokenHooks();
	const { socketToken } = socketTokenHooks();

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

	// Parse lat/lng/zoom from the selected transportation
	const mapCenter: [number, number] = selectedTrans
		? [parseFloat(selectedTrans.lat), parseFloat(selectedTrans.lng)]
		: [-7.2575, 112.7521]; // Default to Surabaya

	const mapZoom = selectedTrans ? Number.parseInt(selectedTrans.zoom, 10) : 12;

	useSocketIO()

	// Fetch corridor data
	const { data: corridors, isLoading: isCorridorsLoading } = useQuery({
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

	// Fetch initial vehicle position data
	const { data: vehiclesResponse, isLoading: isVehiclesLoading } = useQuery({
		queryKey: ["position", route, socketToken],
		queryFn: async () => {
			if (!route || !socketToken) return null;
			const initialRoutes = await findInitialRoutes({
				data: {
					route,
					token: socketToken,
				},
			});
			return initialRoutes;
		},
		enabled: !!route && !!socketToken,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	// Show loading state
	if (isCorridorsLoading || isVehiclesLoading) {
		return (
			<div className="h-[calc(100vh-120px)] w-full flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// Show empty state if no data
	if (!corridors || corridors.length === 0) {
		return (
			<div className="h-[calc(100vh-120px)] w-full flex items-center justify-center text-gray-500">
				<p>Select a transportation mode to view routes</p>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-120px)] w-full">
			<ClientOnlyMap
				corridors={corridors || []}
				vehicles={vehiclesResponse?.data || []}
				center={mapCenter}
				zoom={mapZoom}
			/>
		</div>
	);
}
