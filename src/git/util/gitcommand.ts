import {
    ChildProcess,
    spawn,
} from "child_process";
import {
    dirname,
    normalize,
} from "path";

import { container } from "tsyringe";

import { GIT_COMMAND_IN_PATH } from "../../constants";
import { validEditor } from "../../util/editorvalidator";
import { Property } from "../../util/property";
import { ErrorHandler } from "../../util/errorhandler";
import { ActiveTextEditor } from "../../vscode-api/active-text-editor";
import { ExtensionGetter } from "../../vscode-api/get-extension";
import { Executor } from "../../util/execcommand";

export async function getGitCommand(): Promise<string> {
    const vscodeGit = container
        .resolve<ExtensionGetter>("ExtensionGetter").get();

    if (vscodeGit && vscodeGit.exports.enabled) {
        const api = vscodeGit.exports.getAPI(1);
        if (api.state === "initialized") {
            return Promise.resolve(api.git.path);
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

    return Promise.resolve(GIT_COMMAND_IN_PATH);
}

export async function getOriginOfActiveFile(
    remoteName: string,
): Promise<string> {
    const activeEditor = container
        .resolve<ActiveTextEditor>("ActiveTextEditor").get();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const gitCommand = await getGitCommand();
    const activeFile = activeEditor.document.fileName;
    const activeFileFolder = dirname(activeFile);
    const originUrl = await container.resolve<Executor>("Executor")
        .execute(gitCommand, [
            "ls-remote",
            "--get-url",
            remoteName,
        ], {
            cwd: activeFileFolder,
        });

    return originUrl.trim();
}

export async function getRemoteUrl(fallbackRemote: string): Promise<string> {
    const activeEditor = container
        .resolve<ActiveTextEditor>("ActiveTextEditor").get();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const gitCommand = await getGitCommand();
    const activeFile = activeEditor.document.fileName;
    const activeFileFolder = dirname(activeFile);
    const currentBranch = await container.resolve<Executor>("Executor")
        .execute(gitCommand, [
            "symbolic-ref",
            "-q",
            "--short",
            "HEAD",
        ], {
            cwd: activeFileFolder,
        });
    const curRemote = await container.resolve<Executor>("Executor")
        .execute(gitCommand, [
            "config",
            "--local",
            "--get",
            `branch.${ currentBranch.trim() }.remote`,
        ], {
            cwd: activeFileFolder,
        });
    const remoteUrl = await container.resolve<Executor>("Executor")
        .execute(gitCommand, [
            "config",
            "--local",
            "--get",
            `remote.${ curRemote.trim() || fallbackRemote }.url`,
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
    const workTree = await container.resolve<Executor>("Executor")
        .execute(
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

    if (container.resolve<Property>("Property").get("ignoreWhitespace")) {
        args.push("-w");
    }

    args.push("--incremental");
    args.push("--");
    args.push(fileName);

    const gitCommand = await getGitCommand();
    const spawnOptions = {
        cwd: dirname(fileName),
    };

    container.resolve<ErrorHandler>("ErrorHandler").logCommand(
        `${gitCommand} ${args.join(" ")}`,
    );

    return spawn(gitCommand, args, spawnOptions);
}
