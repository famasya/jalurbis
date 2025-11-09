import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "~/components/ui/spinner";
import { tokenHooks } from "~/hooks/token-hooks";
import { getTrans } from "~/server/get-trans";

export const Route = createFileRoute("/_layout/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { token } = tokenHooks();
	const navigate = useNavigate();

	// Fetch transportation modes to get the first one
	const { data: transData, isLoading } = useQuery({
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

	// Redirect to first transportation mode when data is loaded
	useEffect(() => {
		if (transData && transData.length > 0) {
			const firstTrans = transData[0];
			navigate({
				to: "/$code",
				params: { code: firstTrans.pref },
				search: { route: firstTrans.route },
			});
		}
	}, [transData, navigate]);

	return (
		<div className="h-[calc(100vh-120px)] w-full flex items-center justify-center">
			<Spinner />
		</div>
	);
}
