import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import z from "zod";
import { decrypt, encrypt } from "~/lib/encrypt-token";

const GpsDataSchema = z.object({
  // Time since last update, often a stringified number.
  ago: z.string().or(z.null()),
  // Altitude, often a stringified number, but appears as "0".
  altitude: z.string(),
  // Angle/Bearing in degrees.
  angle: z.number().int().min(0).max(360),
  // Distance to shelter, observed as null.
  dist_shel: z.union([z.string(), z.null()]),
  // Server-side timestamp of reception.
  dt_server: z.string(), // ISO 8601-like format, using .datetime() for strictness.
  // Tracker-side timestamp.
  dt_tracker: z.string(), // ISO 8601-like format.
  // Time gap/interval, often a stringified number.
  gap: z.string(),
  // Unique ID of the record/device.
  id: z.string(),
  // IMEI of the device.
  imei: z.string(),
  // IP address of the device or relay.
  ip: z.string(), // Using .ip() for validation.
  // Route identifier or similar, can be a hyphen.
  kor: z.string(),
  // Latitude.
  lat: z.number(),
  // Longitude.
  lng: z.number(),
  // Friendly name of the vehicle/device.
  name: z.string(),
  // New shelter time/identifier, can be null.
  new_shel_t: z.union([z.string(), z.null()]),
  // Old shelter time/identifier, can be null.
  old_shel_t: z.union([z.string(), z.null()]),
  // Vehicle plate number (contains a sophisticated unicode character '⚿').
  plate_number: z.string(),
  // Port number, often a stringified number.
  port: z.string(),
  // Prefix/Code, often a stringified number.
  pref: z.string(),
  // 'prosen' field, a stringified number, null, or a stringified negative number.
  prosen: z.union([z.string(), z.null()]),
  // Protocol name.
  protocol: z.string(),
  // Speed.
  speed: z.number().int().min(0),
  // Direction/Destination name.
  toward: z.string(),
}).strict();

const ResponseSchema = z.object({
  // Status code: observed as 1 (number).
  status: z.literal(1).or(z.number().int()),
  // Human-readable message: observed as "Success".
  message: z.literal("Success").or(z.string()),
  // The array of GPS/Tracker data records.
  data: z.array(GpsDataSchema),
})

export const findInitialRoutes = createServerFn()
  .inputValidator(z.object({
    token: z.string(),
    route: z.string(), // Encrypted JSON string containing the payload
  }))
  .handler(async ({ data }) => {
    // Decrypt the route to get the payload
    const decryptedRoute = decrypt(data.route);
    const requestPayload = JSON.parse(decryptedRoute);

    // Re-encrypt the request payload with proper JSON formatting (matching Python implementation)
    // The API expects JSON with spaces around colons: "key" : "value"
    const encryptedRequest = encrypt(
      JSON.stringify(requestPayload, null, 2).replace(/": /g, '" : ')
    );

    // Make the API request
    const response = await fetch(`${env.GPS_API_BASE_URL}/findRouteV3`, {
      headers: {
        // NO "Bearer" prefix - just the raw token
        'Authorization': data.token,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ value: encryptedRequest }),
    });

    // The response is a quoted encrypted string
    const responseText = await response.text() as string;

    console.log("Response status:", response.status);
    console.log("Response text (first 200 chars):", responseText.substring(0, 200));
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    // Try to parse as JSON first (in case it's not encrypted)
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log("Response is already JSON:", jsonResponse);
      return ResponseSchema.parse(jsonResponse);
    } catch (e) {
      console.log("Response is not plain JSON, attempting to decrypt...");
    }

    // Remove surrounding quotes if present
    const encryptedResponse = responseText.trim().replace(/^"|"$/g, '');

    // Decrypt the response
    const decryptedResponse = decrypt(encryptedResponse);

    // Parse and validate the decrypted JSON
    const parsedResponse = JSON.parse(decryptedResponse);

    return ResponseSchema.parse(parsedResponse);
  })
