// config/rollup.config.js
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

export default {
  input: 'src/Code.ts',
  output: {
    file: 'build/Code.gs',
    format: 'iife',      // Apps Script needs a single IIFE bundle
    name: undefined,     // avoid polluting global with a bundle name
    sourcemap: false,
  },
  plugins: [
    alias({
      entries: [
        { find: '@domain',   replacement: path.join(root, 'src/domain') },
        { find: '@gas',      replacement: path.join(root, 'src/gas') },
        { find: '@lib',      replacement: path.join(root, 'src/lib') },
        { find: '@logging',  replacement: path.join(root, 'src/lib/logging') },
        { find: '@queue',    replacement: path.join(root, 'src/features/queue') },
        { find: '@sheets',   replacement: path.join(root, 'src/features/sheets') },
        { find: '@workflow', replacement: path.join(root, 'src/features/workflow') },
      ],
    }),
    resolve({ extensions: ['.ts', '.js'] }),
    commonjs(),
    typescript({ tsconfig: 'config/tsconfig.clasp.json' }),
  ],
  treeshake: false,
};
