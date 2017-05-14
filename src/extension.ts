import {GitBlame} from './gitblame';
import {StatusBarView} from './view';
import {GitBlameController} from './controller';
import {TextDecorator} from './textdecorator';
import {window, ExtensionContext, Disposable, StatusBarAlignment,
        workspace, TextEditor, TextEditorSelectionChangeEvent,
        commands, Uri} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {isWebUri} from 'valid-url';

const globalBlamer = new GitBlame();

export function activate(context: ExtensionContext) {

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
    lookupRepo(context, workspaceRoot);
}

function lookupRepo(context: ExtensionContext, repoDir: string) {
    const repoPath = path.join(repoDir, '.git');

    fs.access(repoPath, (err) => {
        if (err) {
            // No access to git repo or no repo, try to go up.
            const parentDir = path.dirname(repoDir);
            if (parentDir != repoDir) {
                lookupRepo(context, parentDir);
            }
        }
        else {
            const statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
            const gitBlame = globalBlamer.createBlamer(repoPath);
            const controller = new GitBlameController(gitBlame, repoDir, new StatusBarView(statusBar));

            context.subscriptions.push(controller);
            context.subscriptions.push(gitBlame);
        }
    });
}

function showMessage(context: ExtensionContext, repoDir: string) {
    const repoPath = path.join(repoDir, '.git');
    const viewOnlineTitle = 'View';
    const config = workspace.getConfiguration('gitblame');
    const commitUrl = <string>config.get('commitUrl');
    const messageFormat = <string>config.get('infoMessageFormat');

    fs.access(repoPath, (err) => {
        if (err) {
            // No access to git repo or no repo, try to go up.
            const parentDir = path.dirname(repoDir);
            if (parentDir != repoDir) {
                showMessage(context, parentDir);
            }
        }
        else {
            const editor = window.activeTextEditor;

            if (!editor) return;

            const doc = editor.document;

            if (!doc) return;
            if (doc.isUntitled) return; // Document hasn't been saved and is not in git.

            const gitBlame = globalBlamer.createBlamer(repoPath);
            const lineNumber = editor.selection.active.line + 1; // line is zero based
            const file = path.relative(repoDir, editor.document.fileName);

            gitBlame.getBlameInfo(file).then((info) => {

                if (!info['lines'].hasOwnProperty(lineNumber)) return info;

                const hash = info['lines'][lineNumber]['hash'];
                const commitInfo = info['commits'][hash];
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
                        window.showErrorMessage('Malformed URL in setting gitblame.commitUrl. Must be a valid web url');
                    }

                    if (urlToUse) {
                        infoMessageArguments.push(viewOnlineTitle);
                    }
                }

                window.showInformationMessage.apply(this, infoMessageArguments)
                    .then((item) => {
                        if (item === viewOnlineTitle) {
                            return commands.executeCommand('vscode.open', urlToUse);
                        }
                    }).then(() => {}, error => console.log(error));
            });
        }
    });
}
