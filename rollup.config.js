import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
    input: "src/index.ts",
    output: {
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
        typescript(),
        terser({
            ecma: 2019,
            compress: {
                keep_classnames: false,
                passes: 4,
                toplevel: true,
                keep_fargs: false,
                unsafe_arrows: true,
                unsafe_methods: true,
                pure_getters: true,
                module: true,
            },
            format: {
                semicolons: false,
            },
        }),
    ],
};
