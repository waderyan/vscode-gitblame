import Path = require('path');
import FS = require('fs');

import { workspace } from 'vscode';

import { ErrorHandler } from './errorhandler';
import { GIT_COMMAND_IN_PATH } from '../constants';

export function getGitCommand(): Promise<string> {
    const gitConfig = workspace.getConfiguration('git');
    const command =
        <string>gitConfig.get('path', GIT_COMMAND_IN_PATH) ||
        GIT_COMMAND_IN_PATH;
    const promise = new Promise<string>((resolve, reject) => {
        if (command === GIT_COMMAND_IN_PATH) {
            resolve(command);
        }

        const commandPath = Path.normalize(command);

        FS.access(commandPath, FS.constants.X_OK, (err) => {
            if (err) {
                ErrorHandler.getInstance().logError(
                    new Error(
                        `Can not execute "${commandPath}" (your git.path property) falling back to "${GIT_COMMAND_IN_PATH}"`
                    )
                );
                resolve(GIT_COMMAND_IN_PATH);
            } else {
                resolve(commandPath);
            }
        });
    });

    return promise;
}
