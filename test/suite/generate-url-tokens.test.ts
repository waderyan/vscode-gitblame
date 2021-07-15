import * as assert from "assert";
import { match, stub } from "sinon";
import { Uri } from "vscode";

import { generateUrlTokens } from "../../src/git/util/get-tool-url";
import { Commit } from "../../src/git/util/stream-parsing";
import * as execcommand from "../../src/util/execcommand";
import * as getActive from "../../src/util/get-active";
import * as property from "../../src/util/property";

suite("Generate URL Tokens", () => {
    const call = (func: string | ((index: string | undefined) => string | undefined), arg?: string) =>
        typeof func === "function" ? func(arg) : func;

    const exampleCommit: Commit = {
        "author": {
            "mail": "<vdavydov.dev@gmail.com>",
            "name": "Vladimir Davydov",
            "timestamp": "1423781950",
            "date": new Date(1423781950000),
            "tz": "-0800",
        },
        "committer": {
            "mail": "<torvalds@linux-foundation.org>",
            "name": "Linus Torvalds",
            "timestamp": "1423796049",
            "date": new Date(1423796049000),
            "tz": "-0800",
        },
        "hash": "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce",
        "summary": "list_lru: introduce per-memcg lists",
    };
    test("http:// origin", async () => {
        const activeEditorStub = stub(getActive, "getActiveTextEditor");
        const execcommandStub = stub(execcommand, "execute");
        const propertyStub = stub(property, "getProperty");
        activeEditorStub.returns({
            document: {
                isUntitled: false,
                fileName: "/fake.file",
                uri: Uri.parse("/fake.file"),
            },
            selection: {
                active: {
                    line: 1,
                },
            },
        });
        execcommandStub.withArgs(match.string, ["symbolic-ref", "-q", "--short", "HEAD"], match.object)
            .resolves("master");
        execcommandStub.withArgs(match.string, ["config", "branch.master.remote"], match.object)
            .resolves("origin");
        execcommandStub.withArgs(match.string, ["config", "remote.origin.url"], match.object)
            .resolves("https://github.com/Sertion/vscode-gitblame.git");
        execcommandStub.withArgs(match.string, ["ls-remote", "--get-url", "origin"], match.object)
            .resolves("https://github.com/Sertion/vscode-gitblame.git");
        execcommandStub.withArgs(match.string, ["ls-files", "--full-name", "--", "/fake.file"], match.object)
            .resolves("/fake.file");
        propertyStub.withArgs("remoteName").returns("origin");

        const [origin, tokens] = await generateUrlTokens(exampleCommit);

        activeEditorStub.restore();
        execcommandStub.restore();
        propertyStub.restore();

        assert.strictEqual(origin, "https://github.com/Sertion/vscode-gitblame.git");

        assert.strictEqual(call(tokens["gitorigin.hostname"], ""), "github.com");
        assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "github");
        assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "com");
        assert.strictEqual(call(tokens["gitorigin.path"], ""), "/Sertion/vscode-gitblame");
        assert.strictEqual(call(tokens["gitorigin.path"], "0"), "Sertion");
        assert.strictEqual(call(tokens["gitorigin.path"], "1"), "vscode-gitblame");
        assert.strictEqual(call(tokens["hash"]), "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce");
        assert.strictEqual(call(tokens["project.name"]), "vscode-gitblame");
        assert.strictEqual(call(tokens["project.remote"]), "github.com/Sertion/vscode-gitblame");
        assert.strictEqual(call(tokens["file.path"]), "/fake.file");
    });

    test("git@ origin", async () => {
        const activeEditorStub = stub(getActive, "getActiveTextEditor");
        const execcommandStub = stub(execcommand, "execute");
        const propertyStub = stub(property, "getProperty");
        activeEditorStub.returns({
            document: {
                isUntitled: false,
                fileName: "/fake.file",
                uri: Uri.parse("/fake.file"),
            },
            selection: {
                active: {
                    line: 1,
                },
            },
        });
        execcommandStub.withArgs(match.string, ["symbolic-ref", "-q", "--short", "HEAD"], match.object)
            .resolves("master");
        execcommandStub.withArgs(match.string, ["config", "branch.master.remote"], match.object)
            .resolves("origin");
        execcommandStub.withArgs(match.string, ["config", "remote.origin.url"], match.object)
            .resolves("git@github.com:Sertion/vscode-gitblame.git");
        execcommandStub.withArgs(match.string, ["ls-remote", "--get-url", "origin"], match.object)
            .resolves("git@github.com:Sertion/vscode-gitblame.git");
        execcommandStub.withArgs(match.string, ["ls-files", "--full-name", "--", "/fake.file"], match.object)
            .resolves("/fake.file");
        propertyStub.withArgs("remoteName").returns("origin");

        const [origin, tokens] = await generateUrlTokens(exampleCommit);

        activeEditorStub.restore();
        execcommandStub.restore();
        propertyStub.restore();

        assert.strictEqual(origin, "git@github.com:Sertion/vscode-gitblame.git");

        assert.strictEqual(call(tokens["gitorigin.hostname"], ""), "github.com");
        assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "github");
        assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "com");
        assert.strictEqual(call(tokens["gitorigin.path"], ""), "/Sertion/vscode-gitblame");
        assert.strictEqual(call(tokens["gitorigin.path"], "0"), "Sertion");
        assert.strictEqual(call(tokens["gitorigin.path"], "1"), "vscode-gitblame");
        assert.strictEqual(call(tokens["hash"]), "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce");
        assert.strictEqual(call(tokens["project.name"]), "vscode-gitblame");
        assert.strictEqual(call(tokens["project.remote"]), "github.com/Sertion/vscode-gitblame");
        assert.strictEqual(call(tokens["file.path"]), "/fake.file");
    });

    test("ssh://git@ origin", async () => {
        const activeEditorStub = stub(getActive, "getActiveTextEditor");
        const execcommandStub = stub(execcommand, "execute");
        const propertyStub = stub(property, "getProperty");
        activeEditorStub.returns({
            document: {
                isUntitled: false,
                fileName: "/fake.file",
                uri: Uri.parse("/fake.file"),
            },
            selection: {
                active: {
                    line: 1,
                },
            },
        });
        execcommandStub.withArgs(match.string, ["symbolic-ref", "-q", "--short", "HEAD"], match.object)
            .resolves("master");
        execcommandStub.withArgs(match.string, ["config", "branch.master.remote"], match.object)
            .resolves("origin");
        execcommandStub.withArgs(match.string, ["config", "remote.origin.url"], match.object)
            .resolves("ssh://git@github.com/Sertion/vscode-gitblame.git");
        execcommandStub.withArgs(match.string, ["ls-remote", "--get-url", "origin"], match.object)
            .resolves("ssh://git@github.com/Sertion/vscode-gitblame.git");
        execcommandStub.withArgs(match.string, ["ls-files", "--full-name", "--", "/fake.file"], match.object)
            .resolves("/fake.file");
        propertyStub.withArgs("remoteName").returns("origin");

        const [origin, tokens] = await generateUrlTokens(exampleCommit);

        activeEditorStub.restore();
        execcommandStub.restore();
        propertyStub.restore();

        assert.strictEqual(origin, "ssh://git@github.com/Sertion/vscode-gitblame.git");

        assert.strictEqual(call(tokens["gitorigin.hostname"], ""), "github.com");
        assert.strictEqual(call(tokens["gitorigin.hostname"], "0"), "github");
        assert.strictEqual(call(tokens["gitorigin.hostname"], "1"), "com");
        assert.strictEqual(call(tokens["gitorigin.path"], ""), "/Sertion/vscode-gitblame");
        assert.strictEqual(call(tokens["gitorigin.path"], "0"), "Sertion");
        assert.strictEqual(call(tokens["gitorigin.path"], "1"), "vscode-gitblame");
        assert.strictEqual(call(tokens["hash"]), "60d3fd32a7a9da4c8c93a9f89cfda22a0b4c65ce");
        assert.strictEqual(call(tokens["project.name"]), "vscode-gitblame");
        assert.strictEqual(call(tokens["project.remote"]), "github.com/Sertion/vscode-gitblame");
        assert.strictEqual(call(tokens["file.path"]), "/fake.file");
    });
});
