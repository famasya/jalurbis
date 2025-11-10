import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Bus, Menu } from "lucide-react";
import { tokenHooks } from "~/hooks/token-hooks";
import { useAllShelters } from "~/hooks/use-all-shelters";
import { usePreferences } from "~/hooks/use-preferences";
import { getCorridor } from "~/server/get-corridor";
import { getTrans } from "~/server/get-trans";
import { Button } from "./ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./ui/drawer";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { Switch } from "./ui/switch";
import { UnifiedSearch } from "./unified-search";

export default function BottomNavbar() {
	// Access code from child route params (strict: false allows parent to access child params)
	const { corridor: searchCorridor, shelter: searchShelter } = useSearch({
		strict: false,
	});
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

	const { data: corridors, isError: isCorridorError } = useQuery({
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

	// Fetch all shelters for the selected trans mode
	const { data: allShelters, isLoading: isSheltersLoading } = useAllShelters(
		token,
		corridors || undefined,
	);

	if (isTransError || isCorridorError) {
		return (
			<div className="fixed bottom-0 left-0 right-0 bg-red-100 border-t border-red-200 p-2 text-center">
				<p className="text-red-700 text-sm">Error loading data</p>
			</div>
		);
	}

	if (!transData || !corridors) {
		return null;
	}

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
									?.name.replaceAll(" ", "-") ?? "",
						},
					})
				}
			>
				<SelectTrigger className="rounded-full bg-white h-8">
					<Bus className="w-4 h-4 mr-2 text-muted-foreground" />
					<span className="truncate max-w-[50px] md:max-w-md">
						{selectedTrans ? selectedTrans.name : "Pilih Jalur"}
					</span>
				</SelectTrigger>
				<SelectContent>
					{transData.map((item) => (
						<SelectItem key={item.pref} value={item.pref}>
							{item.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<UnifiedSearch
				corridors={corridors}
				shelters={allShelters ?? undefined}
				isLoading={isSheltersLoading}
				currentCorridor={searchCorridor}
				currentShelter={searchShelter}
			/>
			<OptionDrawer />
		</div>
	);
}

function OptionDrawer() {
	const { preferences, toggleGrayscale, toggleDebugMode } = usePreferences();

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button size="icon-sm" className="rounded-full">
					<Menu />
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<div className="max-w-md w-full mx-auto">
					<DrawerHeader>
						<DrawerTitle>Options</DrawerTitle>
					</DrawerHeader>
					<div className="space-y-4 px-4 pb-4">
						<Label className="flex items-center border p-4 rounded-lg justify-between cursor-pointer">
							<div className="flex flex-col">
								<span>Greyscale Map</span>
								<span className="text-xs text-muted-foreground mt-1">
									Buat peta menjadi abu-abu untuk kenyamanan visual
								</span>
							</div>
							<Switch
								checked={preferences.grayscaleMode}
								onCheckedChange={toggleGrayscale}
							/>
						</Label>
						<Label className="flex items-center border p-4 rounded-lg justify-between cursor-pointer">
							<div className="flex flex-col">
								<span>Debug Mode</span>
								<span className="text-xs text-muted-foreground mt-1">
									Show socket connection status and vehicle updates
								</span>
							</div>
							<Switch
								checked={preferences.debugMode}
								onCheckedChange={toggleDebugMode}
							/>
						</Label>
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button className="rounded-full">Close</Button>
						</DrawerClose>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
