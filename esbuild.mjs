import { build } from "esbuild";

await build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    format: "cjs",
    minify: true,
    target: "node16",
    outfile: "./out/src/index.js",
    external: [
        "vscode",
        "child_process",
        "fs",
        "fs/promises",
        "url",
        "path",
    ],
});
