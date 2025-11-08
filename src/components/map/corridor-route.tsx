import { Polyline, Popup } from "react-leaflet";
import { decodePolyline } from "~/lib/decode-polyline";
import type { Corridor } from "~/types/map";

interface CorridorRouteProps {
	corridor: Corridor;
}

export function CorridorRoute({ corridor }: CorridorRouteProps) {
	// Decode both directions of the route
	const pointsA = decodePolyline(corridor.points_a);
	const pointsB = corridor.points_b ? decodePolyline(corridor.points_b) : null;

	return (
		<>
			{/* Route Direction A */}
			<Polyline
				positions={pointsA}
				pathOptions={{
					color: corridor.color,
					weight: 4,
					opacity: 0.7,
				}}
			>
				<Popup>
					<div className="font-sans">
						<h3 className="font-bold text-base mb-2">{corridor.kor}</h3>
						<div className="space-y-1 text-sm">
							<p>
								<span className="font-semibold">From:</span> {corridor.origin}
							</p>
							<p>
								<span className="font-semibold">To:</span> {corridor.toward}
							</p>
							<p>
								<span className="font-semibold">Operational Hours:</span>{" "}
								{corridor.jam_operasional}
							</p>
							<p>
								<span className="font-semibold">Status:</span>{" "}
								{corridor.is_ops === "1" ? (
									<span className="text-green-600">Operational</span>
								) : (
									<span className="text-red-600">Not Operational</span>
								)}
							</p>
						</div>
					</div>
				</Popup>
			</Polyline>

			{/* Route Direction B (return route) - only render if points_b exists */}
			{pointsB && (
				<Polyline
					positions={pointsB}
					pathOptions={{
						color: corridor.color,
						weight: 4,
						opacity: 0.7,
						dashArray: "10, 5", // Dashed line to differentiate from direction A
					}}
				>
					<Popup>
						<div className="font-sans">
							<h3 className="font-bold text-base mb-2">
								{corridor.kor} (Return)
							</h3>
							<div className="space-y-1 text-sm">
								<p>
									<span className="font-semibold">From:</span> {corridor.toward}
								</p>
								<p>
									<span className="font-semibold">To:</span> {corridor.origin}
								</p>
								<p>
									<span className="font-semibold">Operational Hours:</span>{" "}
									{corridor.jam_operasional}
								</p>
								<p>
									<span className="font-semibold">Status:</span>{" "}
									{corridor.is_ops === "1" ? (
										<span className="text-green-600">Operational</span>
									) : (
										<span className="text-red-600">Not Operational</span>
									)}
								</p>
							</div>
						</div>
					</Popup>
				</Polyline>
			)}
		</>
	);
}
