import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  // Algumas dependências do Helia usam recursos modernos (ex.: top-level await)
  build: { target: 'esnext' }
});
