import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';


export default {
  input: 'src/Code.ts',
  output: {
    file: 'build/Code.gs',
    format: 'iife',
    name: undefined, // ❗ Removes `var globalThis =` assignment
    sourcemap: false
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
  treeshake: false
};
