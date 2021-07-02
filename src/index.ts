import { commands, Disposable, ExtensionContext } from "vscode";

import { extensionName } from "./extension-name";
import { Extension } from "./git/extension";
import { Logger } from "./util/logger";

const registerCommand = (name: string, callback: () => void): Disposable => {
    return commands.registerCommand(`${extensionName}.${name}`, callback);
}

export const activate = (context: ExtensionContext): void => {
    const app = new Extension;

    context.subscriptions.push(
        app,
        Logger.getInstance(),
        registerCommand("quickInfo", () => void app.showMessage()),
        registerCommand("online", () => void app.blameLink()),
        registerCommand("addCommitHashToClipboard", () => void app.copyHash()),
        registerCommand("addToolUrlToClipboard", () => void app.copyToolUrl()),
    );
}
