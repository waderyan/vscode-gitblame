import {
    ChildProcess,
    spawn,
} from "child_process";
import {
    dirname,
    normalize,
} from "path";

import {
    extensions,
    window,
} from "vscode";
import { container } from "tsyringe";

import { GIT_COMMAND_IN_PATH } from "../../constants";
import { validEditor } from "../../util/editorvalidator";
import { execute } from "../../util/execcommand";
import { Property } from "../../util/property";
import { ErrorHandler } from "../../util/errorhandler";
import { GitExtension } from "../../../types/git";

export async function getGitCommand(): Promise<string> {
    const vscodeGit = extensions.getExtension<GitExtension>(
        "vscode.git",
    );

    if (vscodeGit && vscodeGit.exports.enabled) {
        const api = vscodeGit.exports.getAPI(1);
        if (api.state === "initialized") {
            return api.git.path;
        } else {
            return new Promise((resolve): void => {
                api.onDidChangeState((newState): void => {
                    if (newState === "initialized") {
                        resolve(api.git.path);
                    }
                });
            });
        }
    }

    return GIT_COMMAND_IN_PATH;
}

export async function getOriginOfActiveFile(
    remoteName: string,
): Promise<string> {
    if (!validEditor(window.activeTextEditor)) {
        return "";
    }

    const gitCommand = await getGitCommand();
    const activeFile = window.activeTextEditor.document.fileName;
    const activeFileFolder = dirname(activeFile);
    const originUrl = await execute(gitCommand, [
        "ls-remote",
        "--get-url",
        remoteName,
    ], {
        cwd: activeFileFolder,
    });

    return originUrl.trim();
}

export async function getRemoteUrl(): Promise<string> {
    if (!validEditor(window.activeTextEditor)) {
        return "";
    }
    const gitCommand = await getGitCommand();
    const activeFile = window.activeTextEditor.document.fileName;
    const activeFileFolder = dirname(activeFile);
    const currentBranch = await execute(gitCommand, [
        "symbolic-ref",
        "-q",
        "--short",
        "HEAD",
    ], {
        cwd: activeFileFolder,
    });
    const curRemote = await execute(gitCommand, [
        "config",
        "--local",
        "--get",
        `branch.${ currentBranch.trim() }.remote`,
    ], {
        cwd: activeFileFolder,
    });
    const remoteUrl = await execute(gitCommand, [
        "config",
        "--local",
        "--get",
        `remote.${ curRemote.trim() }.url`,
    ], {
        cwd: activeFileFolder,
    });
    return remoteUrl.trim();
}

export async function getWorkTree(fileName: string): Promise<string> {
    const currentDirectory = dirname(fileName);
    const gitCommand = await getGitCommand();
    const gitExecArguments = ["rev-parse", "--show-toplevel"];
    const gitExecOptions = {
        cwd: currentDirectory,
    };
    const workTree = await execute(
        gitCommand,
        gitExecArguments,
        gitExecOptions,
    );

    if (workTree.trim() === "") {
        return "";
    } else {
        return normalize(workTree.trim());
    }
}

export async function spawnGitBlameStreamProcess(
    fileName: string,
): Promise<ChildProcess> {
    const args = [];

    args.push("blame");

    if (container.resolve(Property).get("ignoreWhitespace")) {
        args.push("-w");
    }

    args.push("--incremental");
    args.push("--");
    args.push(fileName);

    const gitCommand = await getGitCommand();
    const spawnOptions = {
        cwd: dirname(fileName),
    };

    container.resolve(ErrorHandler).logCommand(
        `${gitCommand} ${args.join(" ")}`,
    );

    return spawn(gitCommand, args, spawnOptions);
}
