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
        "child_process",
        "fs",
        "url",
        "path",
    ],
    plugins: [
        resolve({
            preferBuiltins: true,
        }),
        commonjs(),
        typescript(),
        terser({
            ecma: 2019,
            compress: {
                unsafe_arrows: true,
                keep_classnames: false,
                passes: 4,
                toplevel: true,
                unsafe_methods: true,
            },
            format: {
                max_line_len: 2500,
            },
        }),
    ],
};
