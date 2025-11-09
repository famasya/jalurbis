import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DebugBar } from "~/components/debug-bar";
import { usePreferences } from "~/hooks/use-preferences";

export const Route = createFileRoute("/_layout")({
	component: RouteComponent,
});

function RouteComponent() {
	const { preferences } = usePreferences();

	return (
		<div>
			<Outlet />
			{preferences.debugMode && <DebugBar />}
		</div>
	);
}
