import L from "leaflet";
import { memo, useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import type { Corridor, Vehicle } from "~/types/map";

interface VehicleMarkerProps {
	vehicle: Vehicle;
	corridors: Corridor[];
}

function VehicleMarkerComponent({ vehicle, corridors }: VehicleMarkerProps) {
	// Find the corridor color that matches this vehicle's kor
	const corridorColor = useMemo(() => {
		const matchingCorridor = corridors.find(
			(corridor) => corridor.kor === vehicle.kor,
		);
		return matchingCorridor?.color || "#2563eb"; // Default to blue if no match
	}, [corridors, vehicle.kor]);

	// Create a custom icon with rotation
	const icon = useMemo(() => {
		const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${vehicle.angle} 16 16)">
          <!-- Bus body -->
          <rect x="10" y="8" width="12" height="16" fill="${corridorColor}" stroke="${corridorColor}" stroke-width="1" rx="2" opacity="0.9"/>
          <!-- Front of bus (top) -->
          <rect x="10" y="6" width="12" height="3" fill="${corridorColor}" stroke="${corridorColor}" stroke-width="1" rx="1"/>
          <!-- Windows -->
          <rect x="11" y="10" width="4" height="3" fill="#dbeafe" rx="0.5"/>
          <rect x="17" y="10" width="4" height="3" fill="#dbeafe" rx="0.5"/>
          <rect x="11" y="15" width="4" height="3" fill="#dbeafe" rx="0.5"/>
          <rect x="17" y="15" width="4" height="3" fill="#dbeafe" rx="0.5"/>
          <!-- Direction indicator (arrow) -->
          <path d="M 16 2 L 19 6 L 13 6 Z" fill="#ef4444" stroke="#dc2626" stroke-width="0.5"/>
        </g>
      </svg>
    `;

		return L.divIcon({
			html: svgIcon,
			className: "custom-vehicle-marker",
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			popupAnchor: [0, -16],
		});
	}, [vehicle.angle, corridorColor]);

	// Format the date
	const lastUpdate = useMemo(() => {
		try {
			const date = new Date(vehicle.dt_server);
			return date.toLocaleString("id-ID", {
				dateStyle: "short",
				timeStyle: "medium",
			});
		} catch {
			return vehicle.dt_server;
		}
	}, [vehicle.dt_server]);

	return (
		<Marker position={[vehicle.lat, vehicle.lng]} icon={icon}>
			<Popup>
				<div className="font-sans min-w-[200px]">
					<h3 className="font-bold text-base mb-2">{vehicle.name}</h3>
					<div className="space-y-1 text-sm">
						<p>
							<span className="font-semibold">Plate:</span>{" "}
							{vehicle.plate_number}
						</p>
						<p>
							<span className="font-semibold">Corridor:</span> {vehicle.kor}
						</p>
						<p>
							<span className="font-semibold">Direction:</span> {vehicle.toward}
						</p>
						<p>
							<span className="font-semibold">Speed:</span> {vehicle.speed} km/h
						</p>
						<p>
							<span className="font-semibold">Passengers:</span>{" "}
							{vehicle.passenger ?? "N/A"}
						</p>
						<p>
							<span className="font-semibold">Heading:</span> {vehicle.angle}°
						</p>
						<p className="text-xs text-gray-600 mt-2">
							Last update: {lastUpdate}
						</p>
					</div>
				</div>
			</Popup>
		</Marker>
	);
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render when vehicle position, angle, or other key properties change
export const VehicleMarker = memo(
	VehicleMarkerComponent,
	(prevProps, nextProps) => {
		// Find corridor colors for comparison
		const prevColor = prevProps.corridors.find(
			(c) => c.kor === prevProps.vehicle.kor,
		)?.color;
		const nextColor = nextProps.corridors.find(
			(c) => c.kor === nextProps.vehicle.kor,
		)?.color;

		// Custom comparison function for better performance
		// Re-render only if key vehicle properties or corridor color change
		return (
			prevProps.vehicle.imei === nextProps.vehicle.imei &&
			prevProps.vehicle.lat === nextProps.vehicle.lat &&
			prevProps.vehicle.lng === nextProps.vehicle.lng &&
			prevProps.vehicle.angle === nextProps.vehicle.angle &&
			prevProps.vehicle.speed === nextProps.vehicle.speed &&
			prevProps.vehicle.dt_tracker === nextProps.vehicle.dt_tracker &&
			prevProps.vehicle.kor === nextProps.vehicle.kor &&
			prevColor === nextColor
		);
	},
);
