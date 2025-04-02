import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  outDir: 'dist',
  external: ['axios'],
  noExternal: ['crypto'],
  treeshake: true,
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': '"production"'
    };
    return options;
  }
});