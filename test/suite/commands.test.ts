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
import {
    initActiveTextEditorSpy,
    restoreActiveTextEditor,
} from "../spy/active-text-editor.spy";
import {
    initExtensionGetterSpy,
    restoreExtensionGetter,
} from "../spy/extension-getter.spy";
import {
    initCommandSpy,
    restoreCommand,
} from "../spy/command.spy";

suite("Commands", (): void => {
    const gitBlame = initGitBlameSpy();
    const clipboard = initClipboardSpy();
    const execcommand = initExeccommandSpy();
    const messages = initMessageServiceSpy();
    const activeTextEditor = initActiveTextEditorSpy();
    const extension = initExtensionGetterSpy();
    const command = initCommandSpy();

    suiteTeardown((): void => {
        restoreGitBlame();
        restoreClipboard();
        restoreExeccommand();
        restoreMessageService();
        restoreActiveTextEditor();
        restoreExtensionGetter();
        restoreCommand();
    });

    teardown((): void => {
        // Reset all spies
        [
            gitBlame,
            clipboard,
            execcommand,
            messages,
            activeTextEditor,
            extension,
            command,
        ]
            .flatMap((e) => Object.values(e))
            .filter((w): w is SinonSpy => "resetHistory" in w)
            .forEach((aSpy): void => aSpy.resetHistory());
    });

    suite("gitblame.addCommitHashToClipboard", (): void => {
        test("All is well", async (): Promise<void> => {
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyHash();

            assert.strictEqual(clipboard.writeSpy.callCount, 1);
            assert.strictEqual(
                clipboard.writeSpy.firstCall.args[0],
                "1234567890123456789012345678901234567890",
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

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0)
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

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });
    });

    suite("gitblame.addToolUrlToClipboard", (): void => {
        test("All is well", async (): Promise<void> => {
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyToolUrl();

            assert.strictEqual(clipboard.writeSpy.callCount, 1);
            assert.strictEqual(
                clipboard.writeSpy.firstCall.args[0],
                `https://github.com/Sertion/vscode-gitblame` +
                `/commit/1234567890123456789012345678901234567890`,
            );
            assert(
                messages.showInfoSpy.calledWith(
                    "Copied tool URL to clipboard",
                ),
            );
        });

        test("Empty commit", async (): Promise<void> => {
            gitBlame.nextEmptyCommit();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyToolUrl();

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });

        test("Commit generation crashes", async (): Promise<void> => {
            gitBlame.nextCrash();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.copyToolUrl();

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });
    });

    suite("gitblame.online", (): void => {
        test("All is well", async (): Promise<void> => {
            const app = container.resolve<GitExtension>("GitExtension");

            await app.blameLink();

            assert.strictEqual(command.executeSpy.callCount, 1);
            assert.strictEqual(
                command.executeSpy.firstCall.args[0],
                "vscode.open",
            );
            assert.strictEqual(
                String(command.executeSpy.firstCall.args[1]),
                `https://github.com/Sertion/vscode-gitblame` +
                `/commit/1234567890123456789012345678901234567890`,
            );
        });

        test("Empty commit", async (): Promise<void> => {
            gitBlame.nextEmptyCommit();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.blameLink();

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });

        test("Commit generation crashes", async (): Promise<void> => {
            gitBlame.nextCrash();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.blameLink();

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });
    });

    suite("gitblame.quickInfo", (): void => {
        test("All is well", async (): Promise<void> => {
            const app = container.resolve<GitExtension>("GitExtension");

            await app.showMessage();

            assert.strictEqual(messages.showInfoSpy.callCount, 1);
            assert.strictEqual(
                messages.showInfoSpy.firstCall.args[0],
                "Fake commit",
            );
        });

        test("Click open", async (): Promise<void> => {
            const app = container.resolve<GitExtension>("GitExtension");

            const process = app.showMessage();

            // click on the first button here
            messages.prepareItemPress(0);

            await process;

            assert.strictEqual(command.executeSpy.callCount, 1);
            assert.strictEqual(
                command.executeSpy.firstCall.args[0],
                "vscode.open",
            );
            assert.strictEqual(
                String(command.executeSpy.firstCall.args[1]),
                `https://github.com/Sertion/vscode-gitblame` +
                `/commit/1234567890123456789012345678901234567890`,
            );

            messages.unprepareItemPress();
        });

        test("Empty commit", async (): Promise<void> => {
            gitBlame.nextEmptyCommit();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.showMessage();

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });

        test("Commit generation crashes", async (): Promise<void> => {
            gitBlame.nextCrash();
            const app = container.resolve<GitExtension>("GitExtension");

            await app.showMessage();

            assert.strictEqual(clipboard.writeSpy.callCount, 0);
            assert.strictEqual(messages.showInfoSpy.callCount, 0);
            assert.ok(
                messages.showErrorSpy.calledWith(
                    "The current file and line can not be blamed.",
                ),
            );
        });
    });
});
