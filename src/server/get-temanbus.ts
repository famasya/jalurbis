import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import z from "zod";
import { upfetch } from "~/utils/upfetch";

const schema = z.object({
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
      timezone: z.string()
    })
  )
});

export const getTemanBus = createServerFn()
  .handler(async () => {
    return upfetch(`${env.KEMENHUB_BASE_API}/getBtsKotaTemanBus`,
      {
        headers: {
          'X-NGI-TOKEN': env.X_TOKEN
        },
        schema
      },
    )
  });
