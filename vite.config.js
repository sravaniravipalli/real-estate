import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import jsconfigPaths from 'vite-jsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), jsconfigPaths()],
  define: {
    'import.meta.env.VITE_REACT_API_URL': JSON.stringify('https://real-estate-production-1eda.up.railway.app'),
  }
})
