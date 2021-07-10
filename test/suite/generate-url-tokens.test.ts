import * as assert from "assert";
import { match, stub } from "sinon";
import { Uri } from "vscode";

import { generateUrlTokens } from "../../src/git/util/get-tool-url";
import { Commit } from "../../src/git/util/stream-parsing";
import * as execcommand from "../../src/util/execcommand";
import * as getActive from "../../src/util/get-active";

suite('Generate URL Tokens', () => {
    const exampleCommit: Commit = {
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
    };
    test('http:// origin', async () => {
        const activeEditorStub = stub(getActive, "getActiveTextEditor");
        const propertyStub = stub(execcommand, "execute");
        activeEditorStub.returns({
            document: {
                isUntitled: false,
                fileName: '/fake.file',
                uri: Uri.parse('/fake.file'),
            },
            selection: {
                active: {
                    line: 1,
                },
            },
        });
        propertyStub.withArgs(match.string, ["symbolic-ref", "-q", "--short", "HEAD"], match.object)
            .resolves("master");
        propertyStub.withArgs(match.string, ["config", "branch.master.remote"], match.object)
            .resolves("origin");
        propertyStub.withArgs(match.string, ["config", "remote.origin.url"], match.object)
            .resolves("https://github.com/Sertion/vscode-gitblame.git");
        propertyStub.withArgs(match.string, ["ls-remote", "--get-url", 'origin'], match.object)
            .resolves("https://github.com/Sertion/vscode-gitblame.git");
        propertyStub.withArgs(match.string, ["ls-files", "--full-name", 'fake.file'], match.object)
            .resolves("/fake.file");

        const [origin, tokens] = await generateUrlTokens(exampleCommit);

        activeEditorStub.restore();
        propertyStub.restore();

        assert.strictEqual(origin, "https://github.com/Sertion/vscode-gitblame.git");

        assert.strictEqual(tokens["gitorigin.hostname"](""), "github.com");
        assert.strictEqual(tokens["gitorigin.hostname"]("0"), "github");
        assert.strictEqual(tokens["gitorigin.hostname"]("1"), "com");
        assert.strictEqual(tokens["gitorigin.path"](""), "/Sertion/vscode-gitblame");
        assert.strictEqual(tokens["gitorigin.path"]("0"), "Sertion");
        assert.strictEqual(tokens["gitorigin.path"]("1"), "vscode-gitblame");
        assert.strictEqual(tokens["hash"], "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce");
        assert.strictEqual(tokens["project.name"], "vscode-gitblame");
        assert.strictEqual(tokens["project.remote"], "github.com/Sertion/vscode-gitblame");
        assert.strictEqual(tokens["file.path"], "/fake.file");
    });

    test('git@ origin', async () => {
        const activeEditorStub = stub(getActive, "getActiveTextEditor");
        const propertyStub = stub(execcommand, "execute");
        activeEditorStub.returns({
            document: {
                isUntitled: false,
                fileName: '/fake.file',
                uri: Uri.parse('/fake.file'),
            },
            selection: {
                active: {
                    line: 1,
                },
            },
        });
        propertyStub.withArgs(match.string, ["symbolic-ref", "-q", "--short", "HEAD"], match.object)
            .resolves("master");
        propertyStub.withArgs(match.string, ["config", "branch.master.remote"], match.object)
            .resolves("origin");
        propertyStub.withArgs(match.string, ["config", "remote.origin.url"], match.object)
            .resolves("git@github.com:Sertion/vscode-gitblame.git");
        propertyStub.withArgs(match.string, ["ls-remote", "--get-url", 'origin'], match.object)
            .resolves("git@github.com:Sertion/vscode-gitblame.git");
        propertyStub.withArgs(match.string, ["ls-files", "--full-name", 'fake.file'], match.object)
            .resolves("/fake.file");

        const [origin, tokens] = await generateUrlTokens(exampleCommit);

        activeEditorStub.restore();
        propertyStub.restore();

        assert.strictEqual(origin, "git@github.com:Sertion/vscode-gitblame.git");

        assert.strictEqual(tokens["gitorigin.hostname"](""), "github.com");
        assert.strictEqual(tokens["gitorigin.hostname"]("0"), "github");
        assert.strictEqual(tokens["gitorigin.hostname"]("1"), "com");
        assert.strictEqual(tokens["gitorigin.path"](""), "/Sertion/vscode-gitblame");
        assert.strictEqual(tokens["gitorigin.path"]("0"), "Sertion");
        assert.strictEqual(tokens["gitorigin.path"]("1"), "vscode-gitblame");
        assert.strictEqual(tokens["hash"], "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce");
        assert.strictEqual(tokens["project.name"], "vscode-gitblame");
        assert.strictEqual(tokens["project.remote"], "git@github.com/Sertion/vscode-gitblame");
        assert.strictEqual(tokens["file.path"], "/fake.file");
    });
});
