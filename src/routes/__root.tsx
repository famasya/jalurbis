/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type * as React from "react";
import { DefaultCatchBoundary } from "~/components/default-catch-bounday";
import { NotFound } from "~/components/not-found";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title:
					"JalurBis - Peta Jalur Transportasi Umum Indonesia",
				description: `JalurBis adalah peta interaktif yang menampilkan jalur transportasi umum berdasarkan data dari Kemenhub. Lihat rute, jadwal, dan informasi real-time untuk perjalanan yang lebih mudah di seluruh Indonesia.`,
			}),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	errorComponent: DefaultCatchBoundary,
	notFoundComponent: () => <NotFound />,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				{/* Inline script to prevent flash of unstyled content - applies grayscale before React hydrates */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: user config
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									const prefs = localStorage.getItem('user-preferences');
									if (prefs) {
										const parsed = JSON.parse(prefs);
										if (parsed.grayscaleMode) {
											document.documentElement.classList.add('map-grayscale-mode');
										}
									} else {
										// Default to grayscale mode (matches current behavior)
										document.documentElement.classList.add('map-grayscale-mode');
									}
								} catch (e) {
									console.error('Error applying preferences:', e);
								}
							})();
						`,
					}}
				/>
			</head>
			<body className="h-screen w-full bg-background">
				<div className="w-full bg-white overflow-auto min-h-screen">
					{children}
				</div>

				<TanStackRouterDevtools position="bottom-right" />
				<ReactQueryDevtools buttonPosition="bottom-left" />
				<Scripts />
			</body>
		</html>
	);
}
