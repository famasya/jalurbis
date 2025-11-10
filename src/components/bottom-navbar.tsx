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
	DrawerDescription,
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
	const {
		data: transData,
		isError: isTransError,
		isLoading: isTransLoading,
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
									?.find((t) => t.pref === value)
									?.name.replaceAll(" ", "-") ?? "",
						},
					})
				}
			>
				<SelectTrigger
					disabled={isTransLoading}
					className="rounded-full bg-white"
					aria-label="Select transportation route"
				>
					<Bus
						className="w-4 h-4 mr-2 text-muted-foreground"
						aria-hidden="true"
					/>
					<span className="truncate max-w-[50px] md:max-w-md">
						{selectedTrans ? selectedTrans.name : "Pilih Jalur"}
					</span>
				</SelectTrigger>
				<SelectContent>
					{transData?.map((item) => (
						<SelectItem key={item.pref} value={item.pref}>
							{item.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<UnifiedSearch
				corridors={corridors ?? []}
				disabled={isSheltersLoading || isTransLoading || !corridors}
				shelters={allShelters ?? []}
				isLoading={isSheltersLoading || isTransLoading}
				currentCorridor={searchCorridor}
				currentShelter={searchShelter}
			/>
			<OptionDrawer />
		</div>
	);
}

function OptionDrawer() {
	const { preferences, toggleGrayscale, toggleDebugMode, toggleHideVehicles } =
		usePreferences();

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button
					size="icon"
					className="rounded-full"
					aria-label="Open options menu"
				>
					<Menu aria-hidden="true" />
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<div className="max-w-md w-full mx-auto">
					<DrawerHeader>
						<DrawerTitle>Options</DrawerTitle>
						<DrawerDescription>
							Configure map display settings and debug options
						</DrawerDescription>
					</DrawerHeader>
					<div className="space-y-2 px-4 pb-4">
						<div className="flex items-center border p-4 rounded-lg justify-between">
							<Label
								htmlFor="grayscale-switch"
								className="flex flex-col flex-1 cursor-pointer"
							>
								<span>Grayscale Map</span>
								<span className="text-xs text-muted-foreground mt-1" lang="id">
									Buat peta menjadi abu-abu untuk kenyamanan visual
								</span>
							</Label>
							<Switch
								id="grayscale-switch"
								checked={preferences.grayscaleMode}
								onCheckedChange={toggleGrayscale}
								aria-label="Toggle grayscale map mode"
							/>
						</div>
						<div className="flex items-center border p-4 rounded-lg justify-between">
							<Label
								htmlFor="hide-vehicles-switch"
								className="flex flex-col flex-1 cursor-pointer"
							>
								<span>Hide Vehicles</span>
								<span className="text-xs text-muted-foreground mt-1" lang="id">
									Sembunyikan kendaraan real-time di peta
								</span>
							</Label>
							<Switch
								id="hide-vehicles-switch"
								checked={preferences.hideVehicles}
								onCheckedChange={toggleHideVehicles}
								aria-label="Toggle hide vehicles"
							/>
						</div>
						<div className="flex items-center border p-4 rounded-lg justify-between">
							<Label
								htmlFor="debug-mode-switch"
								className="flex flex-col flex-1 cursor-pointer"
							>
								<span>Debug Mode</span>
								<span className="text-xs text-muted-foreground mt-1">
									Show socket connection status and vehicle updates
								</span>
							</Label>
							<Switch
								id="debug-mode-switch"
								checked={preferences.debugMode}
								onCheckedChange={toggleDebugMode}
								aria-label="Toggle debug mode"
							/>
						</div>
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button className="rounded-full">Close</Button>
						</DrawerClose>
						<Button asChild variant={"secondary"} className="rounded-full">
							<a
								href="https://github.com/famasya/jalurbis"
								target="_blank"
								rel="noopener noreferrer"
							>
								Source Code
							</a>
						</Button>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
