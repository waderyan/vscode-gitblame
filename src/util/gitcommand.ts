import { access, constants as FSConstant } from "fs";
import { normalize } from "path";

import { workspace } from "vscode";

import { GIT_COMMAND_IN_PATH } from "../constants";
import { ErrorHandler } from "./errorhandler";

export function getGitCommand(): Promise<string> {
    const gitConfig = workspace.getConfiguration("git");
    const pathCommand = gitConfig.get("path") as string;
    const promise = new Promise<string>((resolve, reject) => {
        if (!pathCommand) {
            resolve(GIT_COMMAND_IN_PATH);
        }

        const commandPath = normalize(pathCommand);

        access(commandPath, FSConstant.X_OK, (err) => {
            if (err) {
                ErrorHandler.getInstance().logError(
                    new Error(
                        `Can not execute "${
                            commandPath
                        }" (your git.path property) falling back to "${
                            GIT_COMMAND_IN_PATH
                        }"`,
                    ),
                );
                resolve(GIT_COMMAND_IN_PATH);
            } else {
                resolve(commandPath);
            }
        });
    });

    return promise;
}
