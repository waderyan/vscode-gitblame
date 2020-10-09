import * as assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";

import {
    Commit,
    Line,
    processChunk,
} from "../../src/git/util/stream-parsing";

function load(fileName: string, buffer: true): Buffer;
function load(fileName: string, buffer: false): string;
function load(fileName: string, buffer: boolean): string | Buffer {
    return readFileSync(
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
            encoding: buffer ? null : "utf-8",
        },
    );
}

suite("Chunk Processing", (): void => {
    test("Process normal chunk", (): void => {
        const chunk = load("git-stream-blame-incremental.chunks", true);
        const result = load("git-stream-blame-incremental-result.json", false);

        const commits = new Set<string>();
        const chunks: (Commit | Line)[] = [];
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

    test("All lines should have known commits", (): void => {
        const chunk = load("git-stream-blame-incremental.chunks", true);

        const commits = new Set<string>();
        const knownCommits: Record<string, Commit> = {};

        for (const blamed of processChunk(chunk, commits)) {
            for (const blame of blamed) {
                if ("author" in blame) {
                    knownCommits[blame.hash] = blame;
                } else {
                    assert.ok(blame[1] in knownCommits);
                }
            }
        }
    });
});
