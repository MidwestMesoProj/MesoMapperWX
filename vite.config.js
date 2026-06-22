import { defineConfig } from 'vite';
import react from '@vitejs/react-refresh'; // or '@vitejs/plugin-react' depending on your file

export default defineConfig({
  plugins: [react()],
  base: '/MesoMapperWX/', // <-- ADD THIS LINE RIGHT HERE
});
