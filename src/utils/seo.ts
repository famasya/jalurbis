export const seo = ({
	title,
	description,
	keywords,
}: {
	title: string;
	description?: string;
	keywords?: string;
}) => {
	const tags = [
		{ title },
		{ name: "description", content: description },
		{ name: "keywords", content: keywords },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:creator", content: "@famasya" },
		{ name: "twitter:site", content: "@famasya" },
		{ name: "og:type", content: "website" },
		{ name: "og:title", content: title },
		{ name: "og:description", content: description },
	];

	return tags;
};
