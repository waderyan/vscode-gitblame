import {
    commands,
    ExtensionContext,
} from "vscode";
import { container } from "tsyringe";

import { GitExtension } from "./git/extension";
import { ErrorHandler } from "./util/errorhandler";
import { Workspace } from "./vscode-api/workspace";

export function activate(context: ExtensionContext): void {
    const inWorkspace = container.resolve<Workspace>("Workspace").has();
    if (inWorkspace) {
        const errorHandler = container.resolve<ErrorHandler>("ErrorHandler");
        const app = container.resolve<GitExtension>("GitExtension");

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
