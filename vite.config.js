import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: packageJson.name,
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
      ],
    },
    sourcemap: false,
    emptyOutDir: true,
  },
  plugins: [
    dts({
      exclude: ['tests/**'],
      tsConfigFilePath: 'tsconfig.production.json',
    }),
  ],
  resolve: {
    alias: {
      '@/src': path.resolve(__dirname, './src'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
});
