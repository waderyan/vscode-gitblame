import { commands, ExtensionContext, workspace } from "vscode";

import { GitExtension } from "./git/extension";
import { ErrorHandler } from "./util/errorhandler";

export function activate(context: ExtensionContext): void {
    if (workspace.workspaceFolders) {
        const errorHandler = ErrorHandler.getInstance();
        const app = GitExtension.getInstance();

        context.subscriptions.push(
            errorHandler,
            commands.registerCommand(
                "gitblame.quickInfo",
                (): void => void app.showMessage(),
            ),
            commands.registerCommand(
                "gitblame.online",
                (): void => void app.blameLink(),
            ),
            commands.registerCommand(
                "gitblame.addCommitHashToClipboard",
                (): void => void app.copyHash(),
            ),
            commands.registerCommand(
                "gitblame.addToolUrlToClipboard",
                (): void => void app.copyToolUrl(),
            ),
        );
    }
}

export function deactivate(): void {
    const app = GitExtension.getInstance();
    app.dispose();
}
