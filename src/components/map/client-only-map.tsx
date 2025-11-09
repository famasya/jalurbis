import { useEffect, useState, type ComponentType } from "react";
import { Spinner } from "~/components/ui/spinner";
import type { Corridor, Shelter, Vehicle } from "~/types/map";

// Client-side only map component wrapper
export default function ClientOnlyMap({
	corridors,
	vehicles,
	shelters,
	selectedCorridorId,
	center,
	zoom,
}: {
	corridors: Corridor[];
	vehicles: Vehicle[];
	shelters: Shelter[];
	selectedCorridorId: string | null;
	center?: [number, number];
	zoom?: number;
}) {
	const [MapComponent, setMapComponent] = useState<ComponentType<{
		corridors: Corridor[];
		vehicles: Vehicle[];
		shelters: Shelter[];
		selectedCorridorId: string | null;
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
			shelters={shelters}
			selectedCorridorId={selectedCorridorId}
			center={center}
			zoom={zoom}
		/>
	);
}
