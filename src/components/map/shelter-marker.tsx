import L from "leaflet";
import { memo, useEffect, useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { lightenColor } from "~/lib/color-utils";
import type { Shelter } from "~/types/map";

interface ShelterMarkerProps {
	shelter: Shelter;
	selectedShelterId?: string | null;
}

function ShelterMarkerComponent({
	shelter,
	selectedShelterId,
}: ShelterMarkerProps) {
	const markerRef = useRef<L.Marker>(null);

	// Create a lighter version of the shelter color for better contrast
	const lightColor = useMemo(() => {
		return lightenColor(shelter.color, 0.4); // 40% lighter
	}, [shelter.color]);

	// Auto-open popup when this shelter is selected
	useEffect(() => {
		if (selectedShelterId === shelter.sh_id && markerRef.current) {
			markerRef.current.openPopup();
		}
	}, [selectedShelterId, shelter.sh_id]);

	// Create a custom icon for shelters
	const icon = useMemo(() => {
		const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g>
          <!-- Shelter pin -->
          <circle cx="12" cy="12" r="10" fill="${lightColor}" stroke="white" stroke-width="2" opacity="0.8"/>
          <!-- Inner circle -->
          <circle cx="12" cy="12" r="4" fill="white"/>
          <!-- Shelter icon (house) -->
          <path d="M 12 8 L 16 11 L 16 15 L 8 15 L 8 11 Z" fill="${lightColor}"/>
        </g>
      </svg>
    `;

		return L.divIcon({
			html: svgIcon,
			className: "custom-shelter-marker",
			iconSize: [24, 24],
			iconAnchor: [12, 12],
			popupAnchor: [0, -12],
		});
	}, [lightColor]);

	return (
		<Marker
			ref={markerRef}
			position={[parseFloat(shelter.sh_lat), parseFloat(shelter.sh_lng)]}
			icon={icon}
		>
			<Popup>
				<div className="font-sans min-w-[150px]">
					<h3 className="font-bold text-base mb-2">{shelter.sh_name}</h3>
					<div className="space-y-1 text-sm">
						<p>
							<span className="font-semibold">Corridor:</span> {shelter.kor}
						</p>
						<p>
							<span className="font-semibold">Origin:</span> {shelter.origin}
						</p>
						{shelter.toward && (
							<p>
								<span className="font-semibold">Toward:</span> {shelter.toward}
							</p>
						)}
					</div>
				</div>
			</Popup>
		</Marker>
	);
}

// Memoize the component to prevent unnecessary re-renders
export const ShelterMarker = memo(
	ShelterMarkerComponent,
	(prevProps, nextProps) => {
		// Re-render only if shelter ID, color, or selected shelter changes
		return (
			prevProps.shelter.sh_id === nextProps.shelter.sh_id &&
			prevProps.shelter.color === nextProps.shelter.color &&
			prevProps.selectedShelterId === nextProps.selectedShelterId
		);
	},
);
