"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Corridor, Vehicle } from "~/types/map";
import { CorridorRoute } from "./corridor-route";
import { VehicleMarker } from "./vehichle-marker";

interface TransportMapProps {
	corridors: Corridor[];
	vehicles: Vehicle[];
	center?: [number, number];
	zoom?: number;
}

export function TransportMap({
	corridors,
	vehicles,
	center = [-7.2575, 112.7521], // Surabaya center
	zoom = 12,
}: TransportMapProps) {
	// Create a unique key for the map based on center to force re-render when center changes
	const mapKey = `${center[0]},${center[1]},${zoom}`;

	return (
		<MapContainer
			key={mapKey}
			center={center}
			zoom={zoom}
			style={{ height: "100%", width: "100%" }}
			className="z-0"
		>
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			/>

			{/* Render all corridor routes */}
			{corridors.map((corridor) => (
				<CorridorRoute key={corridor.id} corridor={corridor} />
			))}

			{/* Render all vehicle markers */}
			{vehicles &&
				Array.isArray(vehicles) &&
				vehicles.map((vehicle) => (
					<VehicleMarker key={vehicle.imei || vehicle.id} vehicle={vehicle} corridors={corridors} />
				))}
		</MapContainer>
	);
}
