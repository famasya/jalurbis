import { up } from "up-fetch";
export const upfetch = up(fetch, () => ({
	headers: {
		"User-Agent": "Mitra Darat/2 CFNetwork/3826.500.131 Darwin/24.5.0",
	},
}));
