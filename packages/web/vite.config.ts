/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: __dirname,
    cacheDir: '../../../node_modules/.vite/packages/web/web',

    server: {
      port: 4200,
      host: 'localhost',
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },

    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    build: {
      outDir: '../../../dist/packages/web/web',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    // Define environment variables to be replaced in the client code
    define: {
      'process.env.VITE_EXPERIMENTATION_API_URL': JSON.stringify(
        env.VITE_EXPERIMENTATION_API_URL || env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000'
      ),
      // For backward compatibility
      'process.env.REACT_APP_EXPERIMENTATION_API_URL': JSON.stringify(
        env.VITE_EXPERIMENTATION_API_URL || env.REACT_APP_EXPERIMENTATION_API_URL || 'http://localhost:3000'
      ),
    },
  };
});
