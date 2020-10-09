import { commands, Disposable, ExtensionContext, workspace } from "vscode";

import { Extension } from "./git/extension";
import { Logger } from "./util/logger";

const registerCommand = (name: string, callback: () => void): Disposable => {
    return commands.registerCommand(name, callback);
}

export function activate(context: ExtensionContext): void {
    if (workspace.workspaceFolders) {
        const app = new Extension;

        context.subscriptions.push(
            app,
            Logger.getInstance(),
            registerCommand(
                "gitblame.quickInfo",
                (): void => void app.showMessage(),
            ),
            registerCommand(
                "gitblame.online",
                (): void => void app.blameLink(),
            ),
            registerCommand(
                "gitblame.addCommitHashToClipboard",
                (): void => void app.copyHash(),
            ),
            registerCommand(
                "gitblame.addToolUrlToClipboard",
                (): void => void app.copyToolUrl(),
            ),
        );
    }
}

export function deactivate(): void {
    // noop
}
