import {workspace} from 'vscode';

export function getGitCommand() {
    const gitConfig = workspace.getConfiguration('git');
    return <string>gitConfig.get('path', 'git') || 'git';
}
