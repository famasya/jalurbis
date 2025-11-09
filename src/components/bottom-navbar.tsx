import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Bus, CircleParking, X } from "lucide-react";
import { tokenHooks } from "~/hooks/token-hooks";
import { getCorridor } from "~/server/get-corridor";
import { getTrans } from "~/server/get-trans";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

export default function BottomNavbar() {
	// Access code from child route params (strict: false allows parent to access child params)
	const { corridor: searchCorridor } = useSearch({ strict: false });
	const params = useParams({ strict: false });
	const code = "code" in params ? params.code : undefined;
	const navigate = useNavigate();
	const { token } = tokenHooks();
	const { data: transData, isError: isTransError } = useQuery({
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

	const { data: corridor, isError: isCorridorError } = useQuery({
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

	if (isTransError || isCorridorError) {
		return (
			<div className="fixed bottom-0 left-0 right-0 bg-red-100 border-t border-red-200 p-2 text-center">
				<p className="text-red-700 text-sm">Error loading data</p>
			</div>
		);
	}

	if (!transData || !corridor) {
		return null;
	}

	const selectedCorridor = corridor.find((c) => c.corridor === searchCorridor);

	return (
		<div className="absolute z-10 bottom-4 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm rounded-full p-2 shadow-lg flex flex-row gap-2">
			<Select
				value={selectedTrans?.pref}
				onValueChange={(value) =>
					navigate({
						to: "/$code/$slug",
						params: {
							code: value,
							slug:
								transData
									.find((t) => t.pref === value)
									?.name.replaceAll(" ", "-")
									.toLowerCase() ?? "",
						},
					})
				}
			>
				<SelectTrigger className="rounded-full bg-white">
					<Bus className="w-4 h-4 mr-2 text-muted-foreground" />
					{selectedTrans ? selectedTrans.name : "Pilih Jalur"}
				</SelectTrigger>
				<SelectContent>
					{transData.map((item) => (
						<SelectItem key={item.pref} value={item.pref}>
							{item.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={searchCorridor}
				onValueChange={(value) =>
					navigate({
						to: ".",
						search: (prev) => ({ ...prev, corridor: value }),
					})
				}
			>
				<SelectTrigger className="rounded-full bg-white">
					<CircleParking className="w-4 h-4 mr-2 text-muted-foreground" />
					{selectedCorridor
						? `Koridor ${selectedCorridor.kor}`
						: <span className="text-muted-foreground">Pilih Koridor</span>}
				</SelectTrigger>
				<SelectContent>
					{corridor?.map((c) => (
						<SelectItem key={c.corridor} value={c.corridor}>
							{c.kor} [{c.origin} → {c.toward}]
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				className="rounded-full"
				disabled={!searchCorridor}
				onClick={() => {
					navigate({
						to: ".",
						search: (prev) => {
							const newSearch = { ...prev };
							delete newSearch.corridor;
							return newSearch;
						},
					});
				}}
			>
				<X /> Clear filter
			</Button>
		</div>
	);
}
