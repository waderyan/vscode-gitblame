import * as assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";

import {
    Commit,
    CommitAuthor,
    CommitRegistry,
    Line,
    processChunk,
} from "../../src/git/util/stream-parsing";

type CommitAuthorStringDate = Omit<CommitAuthor, 'date'> & {
    date: string;
}
type CommitWithAutorStringDate = Omit<Commit, 'author' | 'committer'> & {
    author: CommitAuthorStringDate;
    committer: CommitAuthorStringDate;
}

function load(fileName: string, buffer: true): Buffer;
function load(fileName: string, buffer: false): string;
function load(fileName: string, buffer: boolean): string | Buffer {
    return readFileSync(
        resolve(__dirname, "..", "..", "..", "test", "fixture", fileName),
        {
            encoding: buffer ? null : "utf-8",
        },
    );
}
function datesToString(convert: (Commit | Line)[]): (CommitWithAutorStringDate | Line)[] {
    const converted: (CommitWithAutorStringDate | Line)[] = [];
    for (const element of convert) {
        if ('author' in element) {
            converted.push({
                ...element,
                author: {
                    ...element.author,
                    date: element.author.date.toJSON(),
                },
                committer: {
                    ...element.committer,
                    date: element.committer.date.toJSON(),
                },
            });
        } else {
            converted.push(element);
        }
    }
    return converted;
}

suite("Chunk Processing", (): void => {
    test("Process normal chunk", (): void => {
        const chunk = load("git-stream-blame-incremental.chunks", true);
        const result = JSON.parse(load("git-stream-blame-incremental-result.json", false)) as string[];

        const registry: CommitRegistry = new Map;
        const chunks: (Commit | Line)[] = [];
        for (const [commit, lines] of processChunk(chunk, registry)) {
            chunks.push(commit);
            for (const line of lines) {
                chunks.push(line);
            }
        }

        assert.strictEqual(
            JSON.stringify(datesToString(chunks)),
            JSON.stringify(result),
        );
    });

    test("All lines should have known commits", (): void => {
        const chunk = load("git-stream-blame-incremental.chunks", true);

        const knownCommits: Record<string, Commit> = {};

        const registry: CommitRegistry = new Map;
        for (const [commit, lines] of processChunk(chunk, registry)) {
            knownCommits[commit.hash] = commit;
            for (const blame of lines) {
                assert.ok(blame[1] in knownCommits);
            }
        }
    });
});

suite("Processing Errors", (): void => {
    test("Git chunk not starting with commit information", (): void => {
        const chunks = JSON.parse(load("git-stream-blame-incremental-multi-chunk.json", false)) as string[];
        const result = JSON.parse(load("git-stream-blame-incremental-multi-chunk-result.json", false)) as string[];

        const registry: CommitRegistry = new Map;

        const foundChunks: (Commit | Line)[] = [];
        for (const chunk of chunks) {
            for (const [commit, lines] of processChunk(Buffer.from(chunk, "utf-8"), registry)) {
                foundChunks.push(commit);
                for (const line of lines) {
                    foundChunks.push(line);
                }
            }
        }

        assert.strictEqual(
            JSON.stringify(datesToString(foundChunks)),
            JSON.stringify(result),
        );
    });
})
