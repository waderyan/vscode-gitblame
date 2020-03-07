import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
    input: "src/index.ts",
    output: {
        sourcemap: true,
        name: "bundle",
        dir: "dist",
        format: "cjs",
    },
    external: [
        "vscode",
    ],
    plugins: [
        resolve({
            preferBuiltins: true,
        }),
        commonjs(),
        typescript(),
        terser(),
    ],
};
