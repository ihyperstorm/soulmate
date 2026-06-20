import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Каталог с package.json / node_modules — не родительский Desktop. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
	// Без явного root Turbopack на Windows иногда резолвит `tailwindcss` от родителя (например Desktop).
	turbopack: {
		root: projectRoot,
	},
};

export default nextConfig;
