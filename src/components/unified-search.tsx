import { useNavigate } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Shelter } from "~/types/map";
import { Button } from "./ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type SearchableItem =
	| {
		type: "corridor";
		corridor: string;
		kor: string;
		origin: string;
		toward: string;
	}
	| {
		type: "shelter";
		sh_id: string;
		sh_name: string;
		kor: string;
		origin: string;
		toward: string;
		corridor: string;
		color_koridor: string;
	};

type UnifiedSearchProps = {
	corridors: Array<{
		corridor: string;
		kor: string;
		origin: string;
		toward: string;
	}>;
	shelters: Shelter[] | undefined;
	isLoading: boolean;
	disabled: boolean;
	currentCorridor?: string;
	currentShelter?: string;
};

export function UnifiedSearch({
	corridors,
	disabled,
	shelters,
	isLoading,
	currentCorridor,
	currentShelter,
}: UnifiedSearchProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const navigate = useNavigate();

	// Combine corridors and shelters into searchable items
	const searchableItems = useMemo<SearchableItem[]>(() => {
		const items: SearchableItem[] = [];

		// Add corridors
		corridors.forEach((c) => {
			items.push({
				type: "corridor",
				corridor: c.corridor,
				kor: c.kor,
				origin: c.origin,
				toward: c.toward,
			});
		});

		// Add shelters
		shelters?.forEach((s) => {
			items.push({
				type: "shelter",
				sh_id: s.sh_id,
				sh_name: s.sh_name,
				kor: s.kor,
				origin: s.origin,
				toward: s.toward,
				corridor: s.in_koridor,
				color_koridor: s.color_koridor,
			});
		});

		return items;
	}, [corridors, shelters]);

	// Setup Fuse.js for fuzzy search
	const fuse = useMemo(
		() =>
			new Fuse(searchableItems, {
				keys: [
					{ name: "sh_name", weight: 2 },
					{ name: "kor", weight: 1.5 },
					{ name: "origin", weight: 1 },
					{ name: "toward", weight: 1 },
				],
				threshold: 0.3,
				minMatchCharLength: 2,
				includeScore: true,
			}),
		[searchableItems],
	);

	// Filter items based on search query
	const filteredItems = useMemo(() => {
		if (!searchQuery || searchQuery.length < 2) {
			return searchableItems;
		}
		return fuse.search(searchQuery).map((result) => result.item);
	}, [searchQuery, fuse, searchableItems]);

	// Group filtered items by type
	const groupedItems = useMemo(() => {
		const grouped = {
			corridors: filteredItems.filter(
				(item) => item.type === "corridor",
			) as Extract<SearchableItem, { type: "corridor" }>[],
			shelters: filteredItems.filter(
				(item) => item.type === "shelter",
			) as Extract<SearchableItem, { type: "shelter" }>[],
		};
		return grouped;
	}, [filteredItems]);

	// Get current selection display
	const currentSelection = useMemo(() => {
		if (currentShelter) {
			const shelter = shelters?.find((s) => s.sh_id === currentShelter);
			if (shelter) {
				return {
					text: shelter.sh_name,
					badge: shelter.kor,
				};
			}
		}
		if (currentCorridor) {
			const corridor = corridors.find((c) => c.corridor === currentCorridor);
			if (corridor) {
				return {
					text: `${corridor.origin} → ${corridor.toward}`,
					badge: corridor.kor,
				};
			}
		}
		return null;
	}, [currentShelter, currentCorridor, shelters, corridors]);

	const handleSelect = (item: SearchableItem) => {
		if (item.type === "corridor") {
			navigate({
				to: ".",
				search: (prev) => ({
					...prev,
					corridor: item.corridor,
					shelter: undefined,
				}),
			});
		} else {
			navigate({
				to: ".",
				search: (prev) => ({
					...prev,
					corridor: item.corridor,
					shelter: item.sh_id,
				}),
			});
		}
		setOpen(false);
		setSearchQuery("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					disabled={disabled}
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="rounded-full bg-white min-w-[120px] max-w-[200px] justify-between"
				>
					{currentSelection ? (
						<span className="flex items-center gap-1.5 truncate">
							<span className="bg-emerald-700 text-primary-foreground rounded-full px-1.5 py-0.5 text-xs font-medium shrink-0">
								{currentSelection.badge}
							</span>
							<span className="truncate text-sm">{currentSelection.text}</span>
						</span>
					) : (
						<span className="flex items-center gap-2 text-muted-foreground">
							<Search className="w-4 h-4" />
							<span className="text-sm">Cari koridor...</span>
						</span>
					)}
					<ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[340px] p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search corridors or shelters..."
						value={searchQuery}
						onValueChange={setSearchQuery}
					/>
					<CommandList className="max-h-[400px]">
						{isLoading ? (
							<div className="py-6 text-center text-sm text-muted-foreground">
								Loading...
							</div>
						) : (
							<>
								<CommandEmpty>No results found.</CommandEmpty>
								{groupedItems.corridors.length > 0 && (
									<CommandGroup heading="Corridors">
										{groupedItems.corridors.map((item) => (
											<CommandItem
												key={item.corridor}
												value={item.corridor}
												onSelect={() => handleSelect(item)}
												className="flex flex-col items-start gap-1 py-2"
											>
												<span className="bg-emerald-700 text-primary-foreground rounded-lg px-2 py-1 text-xs font-medium">
													{item.kor}
												</span>
												<span className="text-xs text-muted-foreground">
													{item.origin} → {item.toward}
												</span>
											</CommandItem>
										))}
									</CommandGroup>
								)}
								{groupedItems.shelters.length > 0 && (
									<CommandGroup heading="Shelters">
										{groupedItems.shelters.map((item) => (
											<CommandItem
												key={item.sh_id}
												value={item.sh_id}
												onSelect={() => handleSelect(item)}
												className="flex flex-col items-start gap-1 py-2"
											>
												<span className="font-medium text-sm">
													{item.sh_name}
												</span>
												<div className="flex items-center gap-2">
													<span className="rounded-lg px-2 py-1 text-xs font-medium bg-sky-700 text-primary-foreground">
														{item.kor}
													</span>
													<span className="text-xs text-muted-foreground">
														{item.origin} → {item.toward}
													</span>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								)}
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
