import {handleErrorToLog} from './errorhandler';
import {GitBlame} from './gitblame';
import {StatusBarView} from './view';
import {GitBlameController} from './controller';
import {validEditor} from './editorvalidator';
import {TextDecorator} from './textdecorator';
import {window, ExtensionContext, Disposable, StatusBarAlignment,
        workspace, TextEditor, TextEditorSelectionChangeEvent,
        commands, Uri} from 'vscode';
import * as Path from 'path';
import {isWebUri} from 'valid-url';

const globalBlamer = new GitBlame();

export async function activate(context: ExtensionContext): Promise<void> {

    // Workspace not using a folder. No access to git repo.
    if (!workspace.rootPath) {
        return;
    }

    commands.registerCommand('extension.blame', () => {
        showMessage(context);
    });

    // Try to find the repo first in the workspace, then in parent directories
    // because sometimes one opens a subdirectory but still wants information
    // about the full repo.
    try {
        await lookupRepo(context);
    } catch (err) {
        return;
    }
}

async function lookupRepo(context: ExtensionContext): Promise<GitBlameController> {
    const statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    const controller = new GitBlameController(globalBlamer, new StatusBarView(statusBar));

    context.subscriptions.push(controller);
    context.subscriptions.push(globalBlamer);

    return Promise.resolve(controller);
}

async function showMessage(context: ExtensionContext): Promise<void> {
    const viewOnlineTitle = 'View';
    const config = workspace.getConfiguration('gitblame');
    const commitUrl = <string>config.get('commitUrl');
    const messageFormat = <string>config.get('infoMessageFormat');
    const editor = window.activeTextEditor;
    let commitInfo = null;

    if (!validEditor(editor)) return;

    try {
        commitInfo = await globalBlamer.getLineInfo(editor.document.fileName, editor.selection.active.line);
    } catch (err) {
        handleErrorToLog(err);
        return;
    }

    const normalizedCommitInfo = TextDecorator.normalizeCommitInfoTokens(commitInfo);
    let infoMessageArguments = [];
    let urlToUse = null;

    // Add the message
    infoMessageArguments.push(TextDecorator.parseTokens(messageFormat, normalizedCommitInfo));

    if (commitUrl) {
        // If we have a commitUrl we parse it and add it
        let parsedUrl = TextDecorator.parseTokens(commitUrl, {
            'hash': commitInfo.hash
        });

        if (isWebUri(parsedUrl)) {
            urlToUse = Uri.parse(parsedUrl);
        }
        else {
            window.showErrorMessage('Malformed URL in setting gitblame.commitUrl. Must be a valid web url.');
        }

        if (urlToUse) {
            infoMessageArguments.push(viewOnlineTitle);
        }
    }

    const item = await window.showInformationMessage.apply(this, infoMessageArguments)

    if (item === viewOnlineTitle) {
        commands.executeCommand('vscode.open', urlToUse);
    }
}
