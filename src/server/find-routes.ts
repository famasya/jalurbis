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
  // Passenger count, stringified number.
  passenger: z.string().optional(),
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
});

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

    // Make the API request to Socket API
    const response = await fetch(`${env.GPS_API_BASE_URL}/api/findRouteV3`, {
      headers: {
        // NO "Bearer" prefix - just the raw JWT token
        'Authorization': data.token,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ value: encryptedRequest }),
    });

    // Get the response text
    const responseText = await response.text() as string;

    // Try to parse as plain JSON first (API may return unencrypted responses)
    try {
      const jsonResponse = JSON.parse(responseText);
      return ResponseSchema.parse(jsonResponse);
    } catch (e) {
      // If JSON parse fails, try decrypting
      const encryptedResponse = responseText.trim().replace(/^"|"$/g, '');
      const decryptedResponse = decrypt(encryptedResponse);
      const parsedResponse = JSON.parse(decryptedResponse);
      return ResponseSchema.parse(parsedResponse);
    }
  })
