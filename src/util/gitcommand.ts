import { extensions } from "vscode";

import { GIT_COMMAND_IN_PATH } from "../constants";
import { IVscodeGitExtension } from "../git.api.interface";

export function getGitCommand(): string {
    const vscodeGit = extensions.getExtension<IVscodeGitExtension>(
        "vscode.git",
    );

    if (
        vscodeGit
        && vscodeGit.exports
        && vscodeGit.exports.git
        && vscodeGit.exports.git.path
    ) {
        return vscodeGit.exports.git.path;
    } else {
        return GIT_COMMAND_IN_PATH;
    }
}
