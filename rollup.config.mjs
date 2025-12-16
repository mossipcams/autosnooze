import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/autosnooze-card.js',
  output: {
    file: 'custom_components/autosnooze/www/autosnooze-card.js',
    format: 'es',
  },
  plugins: [
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
