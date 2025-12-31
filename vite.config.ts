import path from 'path';
import { fileURLToPath } from 'url'; // 1. Import this helper
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 2. Manually define __dirname and __filename for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // 3. Added '|| ""' to prevent crash if the key is missing in Netlify
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || "")
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
