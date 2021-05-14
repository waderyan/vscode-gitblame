import * as assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";

import {
    ChunkyGenerator,
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

        const chunks: (Commit | Line)[] = [];
        for (const [commit, lines] of processChunk(chunk)) {
            chunks.push(commit);
            for (const line of lines) {
                chunks.push(line);
            }
        }

        assert.deepStrictEqual(
            chunks,
            JSON.parse(result),
        );
    });

    test("All lines should have known commits", (): void => {
        const chunk = load("git-stream-blame-incremental.chunks", true);

        const knownCommits: Record<string, Commit> = {};

        for (const [commit, lines] of processChunk(chunk)) {
            knownCommits[commit.hash] = commit;
            for (const blame of lines) {
                assert.ok(blame[1] in knownCommits);
            }
        }
    });
});

suite("Processing Errors", (): void => {
    test("Incorrect timestamp", (): void => {
        const buffer = Buffer.from(`60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce 454 548 1
author Vladimir Davydov
author-mail <vdavydov.dev@gmail.com>
author-time 1423781950
author-tz -0800
committer Linus Torvalds
committer-mail <torvalds@linux-foundation.org>
committer-time 1423796049
committer-tz -0800
summary list_lru: introduce per-memcg lists
previous c0a5b560938a0f2fd2fbf66ddc446c7c2b41383a mm/list_lru.c
filename mm/list_lru.c
`);

        const process = processChunk(buffer);
        const [commit, lines] = process.next().value as ChunkyGenerator;

        assert.deepStrictEqual(commit, {
            "author": {
                "mail": "<vdavydov.dev@gmail.com>",
                "name": "Vladimir Davydov",
                "time": 1423781950,
                "tz": "-0800",
            },
            "committer": {
                "mail": "<torvalds@linux-foundation.org>",
                "name": "Linus Torvalds",
                "time": 1423796049,
                "tz": "-0800",
            },
            "hash": "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
            "summary": "list_lru: introduce per-memcg lists",
        });
        assert.ok(process.next().done);

        assert.deepStrictEqual(lines.next().value, [548, "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce"]);
        assert.ok(lines.next().done);
    });
})
