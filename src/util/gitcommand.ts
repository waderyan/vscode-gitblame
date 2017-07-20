import Path = require('path');
import FS = require('fs');

import { workspace } from 'vscode';

import { ErrorHandler } from './errorhandler';
import { GIT_COMMAND_IN_PATH } from '../constants'


export function getGitCommand(): string {
    const gitConfig = workspace.getConfiguration('git');
    const command = <string>gitConfig.get('path', GIT_COMMAND_IN_PATH) || GIT_COMMAND_IN_PATH;

    if (command === GIT_COMMAND_IN_PATH) {
        return command;
    }

    const commandPath = Path.normalize(command);
    const isCommandPathThere = FS.existsSync(commandPath);
    const isCommandExecutable = isCommandPathThere ? FS.accessSync(commandPath, FS.constants.X_OK) : false;

    if (isCommandExecutable) {
        return commandPath;
    }
    else {
        ErrorHandler.getInstance().logError(new Error(`Can not execute "${commandPath}" (your git.path property) falling back to "${GIT_COMMAND_IN_PATH}"`));
        return GIT_COMMAND_IN_PATH;
    }
}
