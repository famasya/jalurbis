import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useParams,
} from "@tanstack/react-router";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { Spinner } from "~/components/ui/spinner";
import { tokenHooks } from "~/hooks/token-hooks";
import { getCorridor } from "~/server/get-corridor";
import { getTrans } from "~/server/get-trans";

export const Route = createFileRoute("/_layout")({
	component: RouteComponent,
});

function RouteComponent() {
	// Access code from child route params (strict: false allows parent to access child params)
	const params = useParams({ strict: false });
	const code = "code" in params ? params.code : undefined;
	const { token } = tokenHooks();
	const {
		data: transData,
		error: transError,
		isError: isTransError,
	} = useQuery({
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

	// Derive trans from code
	const selectedTrans = transData?.find((t) => t.pref === code);
	const trans = selectedTrans?.trans;

	const {
		data: corridor,
		error: corridorError,
		isError: isCorridorError,
	} = useQuery({
		queryKey: ["corridor", token, trans, code],
		queryFn: async () => {
			if (!token || !trans || !code) return null;
			const corridor = await getCorridor({
				data: {
					token,
					trans,
					code,
				},
			});
			return corridor;
		},
		enabled: !!token && !!trans && !!code,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	return (
		<div>
			<ScrollArea className="w-full">
				<div className="flex flex-row gap-2 px-4 py-4 flex-nowrap">
					{isTransError ? (
						<div className="text-red-500 text-sm px-4">
							Error loading transportation modes: {transError?.message}
						</div>
					) : transData ? (
						transData.map((item) => (
							<Link
								to="/$code"
								params={{ code: item.pref }}
								search={{ route: item.route }}
								key={item.id}
								activeProps={{ className: "bg-primary/30" }}
								className="rounded-full whitespace-nowrap bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
							>
								{item.name}
							</Link>
						))
					) : (
						<Spinner />
					)}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
			{isCorridorError ? (
				<div className="text-red-500 text-sm px-4 py-2">
					Error loading corridors: {corridorError?.message}
				</div>
			) : corridor ? (
				<ScrollArea className="w-full mx-auto">
					<div className="flex flex-row gap-4 p-4 flex-nowrap">
						{corridor.map((item) => (
							<Link
								to="."
								search={(prev) => ({
									...prev,
									route: undefined,
									corridor: item.corridor,
								})}
								key={item.id}
								className="rounded-full whitespace-nowrap bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
							>
								{item.kor}
							</Link>
						))}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			) : null}
			<Outlet />
		</div>
	);
}
