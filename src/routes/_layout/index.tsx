import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bus } from "lucide-react";
import { tokenHooks } from "~/hooks/token-hooks";
import { getTrans } from "~/server/get-trans";

export const Route = createFileRoute("/_layout/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { token } = tokenHooks();
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

	if (transData && transData.length === 0) {
		return (
			<div className="h-dvh w-full flex items-center justify-center text-gray-500">
				No transportation data available
			</div>
		);
	}

	return (
		<div>
			<div className="h-[calc(100dvh-1rem)] w-full border flex items-center justify-center flex-col gap-2">
				<div className="flex items-center gap-2 text-xl font-medium">
					Jalur Bis
					<Bus className="w-6 h-6" />
				</div>
				<div className="text-sm text-muted-foreground">
					Pilih Jalur Bis di bawah untuk melihat detail.
				</div>
			</div>
		</div>
	);
}
