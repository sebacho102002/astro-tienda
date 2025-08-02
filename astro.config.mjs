import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [tailwind()],
  server: {
    port: parseInt(process.env.PORT) || 4321,
    host: process.env.HOST || '0.0.0.0'
  }
});
