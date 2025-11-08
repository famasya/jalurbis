import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { getToken } from "~/server/get-token";


export const Route = createFileRoute("/")({
	loader: async () => {
		return await getToken()
	},
	component: Home,
});

function Home() {
	const { token } = Route.useLoaderData();

	return (
		<div className="flex flex-col gap-2 h-screen w-full items-center justify-center">
			<Button>Click Me</Button>
			<p>Token: {token || 'No token'}</p>
		</div>
	);
}
