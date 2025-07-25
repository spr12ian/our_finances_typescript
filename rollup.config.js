import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';


export default {
  input: 'src/Code.ts',
  output: {
    file: 'build/Code.gs',
    format: 'iife', // ✅ Required for Apps Script (clasp cannot handle modules)
    name: undefined, // ❗ Removes `var globalThis =` assignment
    sourcemap: false,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'config/tsconfig.clasp.json',
    }),
  ],
  treeshake: false
};
