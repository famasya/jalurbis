import { createFileRoute } from "@tanstack/react-router"
import z from "zod"

export const Route = createFileRoute("/_layout/")({
  validateSearch: z.object({
    trans: z.string().optional(),
    corridor: z.string().optional(),
    route: z.string().optional(),
    code: z.string().optional()
  }).catch({ trans: undefined, corridor: undefined, route: undefined, code: undefined }),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/"!</div>
}
