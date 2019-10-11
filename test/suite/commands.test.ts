import * as assert from "assert";
import { container } from "tsyringe";
import { SinonSpy } from "sinon";

import { GitExtension } from "../../src/git/extension";

import {
    initGitBlameSpy,
    restoreGitBlame,
} from "../spy/gitblame.spy";
import {
    initClipboardSpy,
    restoreClipboard,
} from "../spy/cliboard.spy";
import {
    initExeccommandSpy,
    restoreExeccommand,
} from "../spy/execcommand.spy";
import {
    initMessageServiceSpy,
    restoreMessageService,
} from "../spy/messages.spy";

suite("Commands", (): void => {
    const gitBlame = initGitBlameSpy();
    const clipboard = initClipboardSpy();
    const execcommand = initExeccommandSpy();
    const messages = initMessageServiceSpy();

    suiteTeardown((): void => {
        restoreGitBlame();
        restoreClipboard();
        restoreExeccommand();
        restoreMessageService();
    });

    teardown((): void => {
        // Reset all spies
        [gitBlame, clipboard, execcommand, messages]
            .flatMap((e) => Object.values(e))
            .filter((w): w is SinonSpy => "resetHistory" in w)
            .forEach((aSpy): void => aSpy.resetHistory());
    });

    suite("gitblame.addCommitHashToClipboard", (): void => {
        test("All is well", async (): Promise<void> => {
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyHash();

            assert.equal(1, clipboard.writeSpy.callCount);
            assert.equal(
                "1234567890123456789012345678901234567890",
                clipboard.writeSpy.firstCall.args[0],
            );
            assert(
                messages.showInfoSpy.calledWith(
                    "Copied hash to clipboard",
                ),
            );
        });

        test("Empty commit", async (): Promise<void> => {
            gitBlame.nextEmptyCommit();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyHash();

            assert.strictEqual(0, clipboard.writeSpy.callCount);
            assert.strictEqual(0, messages.showInfoSpy.callCount)
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });

        test("Commit generation crashes", async (): Promise<void> => {
            gitBlame.nextCrash();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyHash();

            assert.strictEqual(0, clipboard.writeSpy.callCount);
            assert.strictEqual(0, messages.showInfoSpy.callCount)
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });
    });

    suite("gitblame.addToolUrlToClipboard", (): void => {});
});
