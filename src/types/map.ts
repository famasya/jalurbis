import z from "zod";

// Corridor schema matching get-corridor.ts
export const CorridorSchema = z.object({
  id: z.string(),
  origin: z.string(),
  toward: z.string(),
  kor: z.string(),
  urut: z.string(),
  points_a: z.string(),
  points_b: z.string().nullable(),
  pref: z.string(),
  color: z.string(),
  jam_operasional: z.string(),
  is_ops: z.string(),
  route: z.string(), // Added by getCorridor handler
});

// Vehicle/GPS data schema matching find-routes.ts
export const VehicleSchema = z.object({
  ago: z.string().nullable(),
  altitude: z.string(),
  angle: z.number().int().min(0).max(360),
  dist_shel: z.string().nullable(),
  dt_server: z.string(),
  dt_tracker: z.string(),
  gap: z.string(),
  id: z.string(),
  imei: z.string(),
  ip: z.string(),
  kor: z.string(),
  lat: z.number(),
  lng: z.number(),
  name: z.string(),
  new_shel_t: z.string().nullable(),
  old_shel_t: z.string().nullable(),
  passenger: z.string().optional(),
  plate_number: z.string(),
  port: z.string(),
  pref: z.string(),
  prosen: z.string().nullable(),
  protocol: z.string(),
  speed: z.number().int().min(0),
  toward: z.string(),
});

// Infer TypeScript types from schemas
export type Corridor = z.infer<typeof CorridorSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
