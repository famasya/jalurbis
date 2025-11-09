import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { decrypt, encrypt } from "~/lib/encrypt-token";

const schema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.object({
		token: z.string(),
	}),
});

export const getSocketToken = createServerFn().handler(async () => {
	try {
		// Step 1: Encrypt the request payload (empty credentials)
		// The API accepts empty id and email for anonymous access
		const requestJson = JSON.stringify(
			{
				email: "",
				id: "",
			},
			null,
			2,
		).replace(/": /g, '" : ');

		const encryptedRequest = encrypt(requestJson);

		// Step 2: Make the request to get the token
		const response = await fetch(`${env.GPS_API_BASE_URL}/api/authToken`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ value: encryptedRequest }),
		});

		const responseText = await response.text();

		// Step 3: Decrypt the response
		// Remove surrounding quotes if present
		const encryptedResponse = responseText.trim().replace(/^"|"$/g, "");

		const decryptedResponse = decrypt(encryptedResponse);

		// Step 4: Parse and validate
		const parsed = JSON.parse(decryptedResponse);
		const validated = schema.parse(parsed);

		// Step 5: Decode the JWT to get expiration
		const tokenParts = validated.data.token.split(".");
		const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());

		return {
			token: validated.data.token,
			exp: payload.exp,
		};
	} catch (error) {
		console.error("Error fetching Socket API token:", error);
		throw new Error("Failed to fetch Socket API token");
	}
});
