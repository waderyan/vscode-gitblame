import {
    ExtensionContext,
    workspace,
    commands } from 'vscode';
import { GitBlameController } from './git/blamecontroller';


export async function activate(context: ExtensionContext): Promise<void> {
    if (workspace.rootPath) {
        const controller = new GitBlameController();
        const blameCommand = commands.registerCommand('gitblame.quickInfo', controller.showMessage, controller);
        const linkCommand = commands.registerCommand('gitblame.online', controller.blameLink, controller);

        context.subscriptions.push(controller, blameCommand, linkCommand);
    }
}
