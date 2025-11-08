import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDecipheriv } from "node:crypto";
import { z } from "zod";

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

		// decode base64
		const decoded = Buffer.from(data, "base64");

		// prepare key and IV
		const key = Buffer.from(env.SECRET_KEY_PTIS, "utf-8");
		const iv = Buffer.from(env.SECRET_KEY_PTIS.slice(0, 16), "utf-8");

		const decipher = createDecipheriv("aes-256-cbc", key, iv);
		decipher.setAutoPadding(true); // handle unpadding

		let decrypted = decipher.update(decoded);
		decrypted = Buffer.concat([decrypted, decipher.final()]);

		const parsed = JSON.parse(decrypted.toString("utf-8"));
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
