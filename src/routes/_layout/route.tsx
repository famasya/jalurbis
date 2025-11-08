import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet, useSearch } from "@tanstack/react-router"
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area"
import { Spinner } from "~/components/ui/spinner"
import { tokenHooks } from "~/hooks/token-hooks"
import { findInitialRoutes } from "~/server/find-routes"
import { getCorridor } from "~/server/get-corridor"
import { getTrans } from "~/server/get-trans"

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
})

function RouteComponent() {
  const { trans, code, route } = useSearch({ from: "/_layout/" })
  const { token } = tokenHooks()
  const { data: transData } = useQuery({
    queryKey: ["trans-data"],
    queryFn: async () => {
      if (!token) return null;
      const trans = await getTrans({
        data: {
          token
        }
      })
      return trans;
    },
    enabled: !!token,
  })

  const { data: corridor } = useQuery({
    queryKey: ["corridor", trans],
    queryFn: async () => {
      if (!token || !trans || !code) return null;
      const corridor = await getCorridor({
        data: {
          token,
          trans,
          code
        }
      })
      return corridor;
    },
    enabled: !!token && !!trans && !!code,
  })
  console.log(corridor)

  const { data: positionData } = useQuery({
    queryKey: ["position", route, token],
    queryFn: async () => {
      if (!route || !token) return null;
      const initialRoutes = findInitialRoutes({
        data: {
          route,
          token
        }
      })
      return initialRoutes;
    },
    enabled: !!route && !!token,
  })

  console.log(positionData)

  return <div>
    <ScrollArea className="w-full">
      <div className="flex flex-row gap-2 px-4 py-4 flex-nowrap">
        {transData ? transData.map(item => <Link to="." search={(prev) => ({ ...prev, trans: item.trans, code: item.pref, route: item.route })} key={item.id} activeProps={{
          className: "bg-primary/30"
        }} className="rounded-full whitespace-nowrap bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors">{item.name}</Link>) : <Spinner />}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
    {corridor ? (
      <ScrollArea className="w-full max-w-4xl mx-auto">
        <div className="flex flex-row gap-4 p-4 flex-nowrap">
          {corridor.map((item) => (
            <Link to="." search={(prev) => ({ ...prev, route: item.route })} key={item.id} activeProps={{
              className: "bg-primary/30"
            }} className="rounded-full whitespace-nowrap bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors">{item.kor}</Link>))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    ) : null}
    <Outlet />
  </div>
}
