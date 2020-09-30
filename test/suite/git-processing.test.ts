import * as assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";

import {
    BlamedCommit,
    BlamedLine,
    processChunk,
} from "../../src/git/util/stream-parsing";

const loadFixture = (fileName: string): string => readFileSync(
    resolve(
        __dirname,
        "..",
        "..",
        "..",
        "test",
        "fixture",
        fileName,
    ),
    {
        encoding: "utf-8",
    },
);

suite("Chunk Processing", (): void => {
    test("Process normal chunk", (): void => {
        const chunk = loadFixture("git-stream-blame-incremental.chunks");
        const result = loadFixture("git-stream-blame-incremental-result.json");

        const commits = new Set<string>();
        const chunks: (BlamedCommit | BlamedLine)[] = [];
        for (const blamed of processChunk(chunk, commits)) {
            for (const blame of blamed) {
                chunks.push(blame);
            }
        }

        assert.deepStrictEqual(
            chunks,
            JSON.parse(result),
        );
    });
});
