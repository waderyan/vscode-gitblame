import "@abraham/reflection";

import {
    commands,
    ExtensionContext,
    workspace,
} from "vscode";
import { container } from "tsyringe";

import { GitExtension } from "./git/extension";
import { ErrorHandler } from "./util/errorhandler";

export function activate(context: ExtensionContext): void {
    if (workspace.workspaceFolders) {
        const errorHandler = container.resolve(ErrorHandler);
        const app = container.resolve(GitExtension);

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
            errorHandler,
            app,
            blameCommand,
            linkCommand,
            copyHashCommand,
            copyToolUrl,
        );
    }
}
