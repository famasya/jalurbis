import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import z from "zod";
import { upfetch } from "~/utils/upfetch";

const schema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.array(
    z.union([
      z.object({
        sh_id: z.string(),
        sh_name: z.string(),
        kor: z.string(),
        origin: z.string(),
        toward: z.string(),
        color: z.string(),
        in_koridor: z.string(),
        color_koridor: z.string(),
        sh_lat: z.string(),
        sh_lng: z.string(),
        or_lat: z.null(),
        or_lng: z.null(),
        tw_lat: z.null(),
        tw_lng: z.null(),
        points: z.string()
      }),
      z.object({
        sh_id: z.string(),
        sh_name: z.string(),
        kor: z.string(),
        origin: z.string(),
        toward: z.string(),
        color: z.string(),
        in_koridor: z.string(),
        color_koridor: z.string(),
        sh_lat: z.string(),
        sh_lng: z.string(),
        or_lat: z.null(),
        or_lng: z.null(),
        tw_lat: z.null(),
        tw_lng: z.null()
      })
    ])
  )
})

export const getRoutesCorridor = createServerFn()
  .inputValidator(z.object({
    token: z.string(),
    corridor: z.string(),
  }))
  .handler(async ({ data }) => {
    const response = await upfetch(`${env.API_BASE_URL}/getRouteCorridor`, {
      headers: {
        authorization: `Bearer ${data.token}`,
      },
      method: "POST",
      body: data.corridor,
      schema
    });

    return response;
  });
