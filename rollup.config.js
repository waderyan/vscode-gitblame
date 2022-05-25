import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import del from 'rollup-plugin-delete'

export default {
    input: "src/index.ts",
    output: {
        dir: "out/src/",
        format: "cjs",
    },
    external: [
        "vscode",
        "child_process",
        "fs",
        "fs/promises",
        "url",
        "path",
    ],
    plugins: [
        del({
            targets: "./out/**",
        }),
        typescript(),
        terser({
            ecma: 2020,
            compress: {
                inline: 2,
                keep_fargs: false,
                module: true,
                passes: 4,
                pure_getters: true,
                toplevel: true,
                unsafe: true,
                unsafe_arrows: true,
                unsafe_methods: true,
            },
            format: {
                ecma: 2020,
                semicolons: false,
            },
        }),
    ],
};
