import { commands, ExtensionContext, workspace } from "vscode";

import { GitBlame } from "./git/blame";

export async function activate(context: ExtensionContext): Promise<void> {
    if (workspace.workspaceFolders) {
        const app = new GitBlame();
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
            blameCommand,
            linkCommand,
            copyHashCommand,
            copyToolUrl,
        );
    }
}
