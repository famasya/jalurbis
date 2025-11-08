import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import z from "zod";
import { encrypt } from "~/lib/encrypt-token";
import { upfetch } from "~/utils/upfetch";

const schema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.array(
		z.union([
			z.object({
				id: z.string(),
				origin: z.string(),
				toward: z.string(),
				kor: z.string(),
				urut: z.string(),
				points_a: z.string(),
				points_b: z.null(),
				pref: z.string(),
				color: z.string(),
				jam_operasional: z.string(),
				is_ops: z.string(),
			}),
			z.object({
				id: z.string(),
				origin: z.string(),
				toward: z.string(),
				kor: z.string(),
				urut: z.string(),
				points_a: z.string(),
				points_b: z.string(),
				pref: z.string(),
				color: z.string(),
				jam_operasional: z.string(),
				is_ops: z.string(),
			}),
		]),
	),
});
export const getCorridor = createServerFn()
	.inputValidator(
		z.object({ token: z.string(), trans: z.string(), code: z.string() }),
	)
	.handler(async ({ data }) => {
		const response = await upfetch(`${env.API_BASE_URL}/getCorridor`, {
			body: data.trans,
			method: "POST",
			headers: {
				Authorization: `Bearer ${data.token}`,
			},
			schema,
		});

		return response.data.map((item) => ({
			...item,
			route: encrypt(
				JSON.stringify({
					key: "NGIxHubdat",
					pref: data.code,
					corridor: "",
					plate_number: "",
					name: "",
				}),
			),
		}));
	});
