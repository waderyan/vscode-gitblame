import {
    commands,
    ExtensionContext,
    workspace,
} from "vscode";

import { GitExtension } from "./git/extension";
import { GitBlame } from "./git/blame";

export function activate(context: ExtensionContext): void {
    if (workspace.workspaceFolders) {
        const blame = new GitBlame();
        const app = new GitExtension(blame);
        const blameCommand = commands.registerCommand(
            "gitblame.quickInfo",
            app.showMessage,
            app,
        );
        const linkCommand = commands.registerCommand(
            "gitblame.online",
            app.blameLink,
            app,
        );
        const copyHashCommand = commands.registerCommand(
            "gitblame.addCommitHashToClipboard",
            app.copyHash,
            app,
        );
        const copyToolUrl = commands.registerCommand(
            "gitblame.addToolUrlToClipboard",
            app.copyToolUrl,
            app,
        );

        context.subscriptions.push(
            app,
            blame,
            blameCommand,
            linkCommand,
            copyHashCommand,
            copyToolUrl,
        );
    }
}
