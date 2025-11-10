import { useNavigate } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Shelter } from "~/types/map";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { ScrollArea } from "./ui/scroll-area";
import { Spinner } from "./ui/spinner";

interface AdvancedSearchProps {
	shelters: Shelter[] | null;
	isLoading: boolean;
}

export default function AdvancedSearch({
	shelters,
	isLoading,
}: AdvancedSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const navigate = useNavigate();

	// Configure Fuse.js for fuzzy search
	const fuse = useMemo(() => {
		if (!shelters) return null;

		return new Fuse(shelters, {
			keys: [
				{ name: "sh_name", weight: 2 }, // Prioritize shelter name
				{ name: "kor", weight: 1.5 },
				{ name: "origin", weight: 1 },
				{ name: "toward", weight: 1 },
			],
			threshold: 0.3,
			includeScore: true,
			minMatchCharLength: 2,
			includeMatches: true,
		});
	}, [shelters]);

	// Perform search
	const searchResults = useMemo(() => {
		if (!fuse || !searchQuery.trim()) {
			return shelters || [];
		}

		const results = fuse.search(searchQuery);
		return results.map((result) => result.item);
	}, [fuse, searchQuery, shelters]);

	const handleShelterSelect = (shelter: Shelter) => {
		// Navigate with both corridor and shelter params
		navigate({
			to: ".",
			search: (prev) => ({
				...prev,
				corridor: shelter.in_koridor, // Auto-select the shelter's corridor
				shelter: shelter.sh_id, // Pass shelter ID for centering
			}),
		});

		// Close the drawer
		setIsOpen(false);
		setSearchQuery(""); // Reset search
	};

	const handleClearSearch = () => {
		setSearchQuery("");
	};

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Button className="rounded-full" size="icon-sm">
					<Search className="w-4 h-4" />
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<div className="max-w-md w-full mx-auto">
					<DrawerHeader>
						<DrawerTitle>Search Shelters</DrawerTitle>
					</DrawerHeader>

					<div className="px-4 pb-4 space-y-4">
						{/* Search Input */}
						<div className="relative">
							<InputGroup>
								<InputGroupInput
									type="text"
									placeholder="Search by shelter name, corridor, or location..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									autoFocus
								/>
								<InputGroupAddon>
									<Search />
								</InputGroupAddon>
							</InputGroup>
							{searchQuery && (
								<button
									type="button"
									onClick={handleClearSearch}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									<X className="w-4 h-4" />
								</button>
							)}
						</div>

						{/* Results */}
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Spinner className="w-6 h-6" />
							</div>
						) : (
							<ScrollArea className="h-[400px] rounded-md border">
								{searchResults.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
										<Search className="w-12 h-12 text-muted-foreground mb-3" />
										<p className="text-sm text-muted-foreground">
											{searchQuery.trim()
												? "No shelters found matching your search"
												: "Start typing to search for shelters"}
										</p>
									</div>
								) : (
									<div className="p-2 space-y-1">
										{searchResults.map((shelter) => (
											<button
												key={shelter.sh_id}
												type="button"
												onClick={() => handleShelterSelect(shelter)}
												className="w-[calc(100%-1.2rem)] text-left p-2 rounded-lg hover:bg-accent transition-colors"
											>
												<div className="flex flex-col gap-1">
													<div className="font-medium text-sm">
														{shelter.sh_name}
													</div>
													<div className="flex items-center gap-2 text-xs">
														<span className="bg-primary text-primary-foreground rounded-lg px-2 py-1 font-medium">
															{shelter.kor}
														</span>
														<span className="text-muted-foreground truncate">
															{shelter.origin} → {shelter.toward}
														</span>
													</div>
												</div>
											</button>
										))}
									</div>
								)}
							</ScrollArea>
						)}

						{/* Results count */}
						{!isLoading && searchResults.length > 0 && (
							<p className="text-xs text-muted-foreground text-center">
								{searchResults.length} shelter
								{searchResults.length !== 1 ? "s" : ""} found
								{searchQuery.trim() && ` for "${searchQuery}"`}
							</p>
						)}
					</div>

					<DrawerFooter>
						<DrawerClose asChild>
							<Button className="rounded-full" variant="outline">
								Close
							</Button>
						</DrawerClose>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
