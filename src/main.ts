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
            (): void => {
                void app.showMessage();
            },
        );
        const linkCommand = commands.registerCommand(
            "gitblame.online",
            (): void => {
                void app.blameLink();
            },
        );
        const copyHashCommand = commands.registerCommand(
            "gitblame.addCommitHashToClipboard",
            (): void => {
                void app.copyHash();
            },
        );
        const copyToolUrl = commands.registerCommand(
            "gitblame.addToolUrlToClipboard",
            (): void => {
                void app.copyToolUrl();
            },
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
