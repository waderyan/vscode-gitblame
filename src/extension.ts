import {GitBlame} from './gitblame';
import {StatusBarView} from './view';
import {GitBlameController} from './controller';
import {findGitPath} from './gitpath';
import {validEditor} from './editorvalidator';
import {TextDecorator} from './textdecorator';
import {window, ExtensionContext, Disposable, StatusBarAlignment,
        workspace, TextEditor, TextEditorSelectionChangeEvent,
        commands, Uri} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {isWebUri} from 'valid-url';

const globalBlamer = new GitBlame();

export async function activate(context: ExtensionContext) {

    // Workspace not using a folder. No access to git repo.
    if (!workspace.rootPath) {
        return;
    }

    const workspaceRoot = workspace.rootPath;
    commands.registerCommand('extension.blame', () => {
        showMessage(context, workspaceRoot);
    });

    // Try to find the repo first in the workspace, then in parent directories
    // because sometimes one opens a subdirectory but still wants information
    // about the full repo.
    try {
        const controller = await lookupRepo(context, workspaceRoot);

        // Listen to file changes and invalidate files when they change
        let fsw = workspace.createFileSystemWatcher('**/*', true);

        fsw.onDidChange((uri) => {
            controller.invalidateFile(uri);
        });
        fsw.onDidDelete((uri) => {
            controller.invalidateFile(uri);
        });
    } catch (err) {
        return;
    }
}

async function lookupRepo(context: ExtensionContext, repositoryDirectory: string): Promise<GitBlameController> {
    const repo = await findGitPath(repositoryDirectory);
    const statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    const gitBlame = globalBlamer.createBlamer(repo.path);
    const controller = new GitBlameController(gitBlame, repo.dir, new StatusBarView(statusBar));

    context.subscriptions.push(controller);
    context.subscriptions.push(gitBlame);

    return Promise.resolve(controller);
}

async function showMessage(context: ExtensionContext, repositoryDirectory: string) {
    const repo = await findGitPath(repositoryDirectory);
    const viewOnlineTitle = 'View';
    const config = workspace.getConfiguration('gitblame');
    const commitUrl = <string>config.get('commitUrl');
    const messageFormat = <string>config.get('infoMessageFormat');
    const editor = window.activeTextEditor;

    if (!validEditor(editor)) return;

    const gitBlame = globalBlamer.createBlamer(repo.path);
    const lineNumber = editor.selection.active.line + 1; // line is zero based
    const file = path.relative(repo.dir, editor.document.fileName);

    const blameInfo = await gitBlame.getBlameInfo(file);

    if (!blameInfo['lines'].hasOwnProperty(lineNumber)) return;

    const hash = blameInfo['lines'][lineNumber]['hash'];
    const commitInfo = blameInfo['commits'][hash];
    let normalizedCommitInfo = TextDecorator.normalizeCommitInfoTokens(commitInfo);
    let infoMessageArguments = [];
    let urlToUse = null;

    // Add the message
    infoMessageArguments.push(TextDecorator.parseTokens(messageFormat, normalizedCommitInfo));

    if (commitUrl) {
        // If we have a commitUrl we parse it and add it
        let parsedUrl = TextDecorator.parseTokens(commitUrl, {
            'hash': hash
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
