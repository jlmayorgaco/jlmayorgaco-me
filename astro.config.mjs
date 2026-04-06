// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import icon from "astro-icon";

import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://jlmayorga.com.co',
	integrations: [
		mdx(), 
		react(), 
		sitemap(), 
		icon()
	],
	
	// Image optimization
	image: {
		service: {
			entrypoint: 'astro/assets/services/sharp',
		},
	},
});
