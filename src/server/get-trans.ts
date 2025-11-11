import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import z from "zod";
import { encrypt } from "~/lib/encrypt-token";
import { upfetch } from "~/utils/upfetch";

const schema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			pref: z.string(),
			lat: z.string(),
			lng: z.string(),
			zoom: z.string(),
			icon: z.string(),
			timezone: z.string(),
			city: z.string(),
			routes: z.string(),
		}),
	),
});

export const getTrans = createServerFn()
	.inputValidator(
		z.object({
			token: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const response = await upfetch(`${env.API_BASE_URL}/getTrans`, {
				headers: {
					authorization: `Bearer ${data.token}`,
				},
				schema,
			});

			return response.data.map((item) => ({
				...item,
				trans: encrypt(`pref=${item.pref}`),
				route: encrypt(
					JSON.stringify({
						key: "NGIxHubdat",
						pref: item.pref,
						corridor: "",
						plate_number: "",
						name: "",
					}),
				),
			}));
		} catch (error) {
			console.error("Error fetching routes:", error);
			throw new Error("Failed to fetch routes");
		}
	});

const temanBusSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.array(
		z.object({
			bts_id: z.string(),
			bts_kota: z.string(),
			label: z.string(),
			icon: z.string(),
			trayek_jml: z.string(),
			pref: z.string(),
			timezone: z.string(),
		}),
	),
});

export const getTemanBus = createServerFn().handler(
	async (): Promise<z.infer<typeof schema>["data"]> => {
		const results = await upfetch(
			`${env.KEMENHUB_BASE_API}/getBtsKotaTemanBus`,
			{
				headers: {
					"X-NGI-TOKEN": env.X_TOKEN,
				},
				schema: temanBusSchema,
			},
		);
		return results.data.map((item) => ({
			city: item.bts_kota,
			icon: item.icon,
			zoom: "12",
			timezone: item.timezone,
			pref: item.pref,
			id: item.bts_id,
			name: item.label,
			lat: "",
			lng: "",
			routes: "",
		}));
	},
);
