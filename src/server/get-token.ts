import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { decrypt } from "~/lib/encrypt-token";

const schema = z.object({
	data: z.object({
		token: z.string(),
		exp: z.number(),
	}),
});

export const getToken = createServerFn().handler(async () => {
	try {
		const result = await fetch(`${env.API_BASE_URL}/getToken`);
		const data = (await result.text()) as string;

		const decrypted = decrypt(data);
		const parsed = JSON.parse(decrypted);
		const validated = schema.safeParse(parsed);

		if (!validated.success) {
			throw new Error(
				`Invalid token data format: ${validated.error.issues.map((e) => e.message).join(", ")}`,
			);
		}

		return {
			token: validated.data.data.token,
			exp: validated.data.data.exp,
		};
	} catch (error) {
		console.error("Error fetching token:", error);
		throw new Error("Failed to fetch token");
	}
});
