import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/index.ts',
  output: {
    file: 'custom_components/autosnooze/www/autosnooze-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    replace({
      preventAssignment: true,
      __VERSION__: JSON.stringify(pkg.version),
    }),
    json(),
    typescript({
      outDir: 'custom_components/autosnooze/www',
    }),
    nodeResolve(),
    terser({
      format: {
        comments: false,
      },
      compress: {
        drop_console: false,
      },
    }),
  ],
};
