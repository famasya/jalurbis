import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useSocketIO } from "~/hooks/use-socket-io";
import type { Vehicle } from "~/types/map";

export function DebugBar() {
	const [update, setUpdate] = useState<null | Vehicle>(null);
	const { isConnected } = useSocketIO({
		onVehicleUpdate: setUpdate,
	});
	const [throttledUpdate] = useDebounceValue(update, 300);
	return (
		<div className="absolute top-2 right-2 bg-white/50 z-10 p-2 rounded-lg shadow-lg backdrop-blur-sm">
			<div className="text-xs font-mono">
				Socket:{" "}
				{isConnected ? (
					<span className="text-green-600">Connected</span>
				) : (
					<span className="text-red-500">Disconnected</span>
				)}
				<br />
				Last update:{" "}
				{throttledUpdate
					? `${throttledUpdate.name} - ${throttledUpdate.speed} km/h`
					: "None"}
			</div>
		</div>
	);
}
