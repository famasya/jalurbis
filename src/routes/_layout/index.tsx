import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
		<div className="h-dvh w-full relative">
			<div className="flex flex-row gap-4 p-4 flex-wrap overflow-x-auto">
				{transData?.map((trans) => (
					<Link
						key={trans.pref}
						to={"/$code/$slug"}
						params={{
							code: trans.pref,
							slug: trans.name.replaceAll(" ", "-"),
						}}
						className="rounded-full bg-primary text-primary-foreground px-3 py-1 whitespace-nowrap"
					>
						<span>{trans.name}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
