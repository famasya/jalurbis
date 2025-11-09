import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import z from "zod";
import { upfetch } from "~/utils/upfetch";
import { ShelterSchema } from "~/types/map";

const schema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.array(ShelterSchema),
});

export const getRoutesCorridor = createServerFn()
	.inputValidator(
		z.object({
			token: z.string(),
			corridor: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const response = await upfetch(`${env.API_BASE_URL}/getRouteCorridor`, {
			headers: {
				authorization: `Bearer ${data.token}`,
			},
			method: "POST",
			body: data.corridor,
			schema,
		});

		return response;
	});
