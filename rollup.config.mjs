import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/autosnooze-card.js',
  output: {
    file: 'custom_components/autosnooze/www/autosnooze-card.js',
    format: 'es',
  },
  plugins: [
    replace({
      preventAssignment: true,
      __VERSION__: JSON.stringify(pkg.version),
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
