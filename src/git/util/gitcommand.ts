import {
    ChildProcess,
    spawn,
} from "child_process";
import {
    basename,
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

function execute(
    command: string,
    args: string[],
    cwd: string,
): Promise<string> {
    return container.resolve<Executor>("Executor")
        .execute(command, args, { cwd });
}

export async function getOriginOfActiveFile(
    remoteName: string,
): Promise<string> {
    const activeEditor = container
        .resolve<ActiveTextEditor>("ActiveTextEditor").get();

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFile = activeEditor.document.fileName;
        const activeFileFolder = dirname(activeFile);
        const originUrl = await execute(
            gitCommand,
            ["ls-remote", "--get-url", remoteName],
            activeFileFolder,
        );

        return originUrl.trim();
    } catch (e) {
        container.resolve<ErrorHandler>("ErrorHandler").logError(e);
        return "";
    }
}

export async function getRemoteUrl(fallbackRemote: string): Promise<string> {
    const activeEditor = container
        .resolve<ActiveTextEditor>("ActiveTextEditor").get();

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFileFolder = dirname(activeEditor.document.fileName);
        const currentBranch = await execute(gitCommand, [
                "symbolic-ref",
                "-q",
                "--short",
                "HEAD",
            ], activeFileFolder);
        const curRemote = await execute(gitCommand, [
                "config",
                "--local",
                "--get",
                `branch.${ currentBranch.trim() }.remote`,
            ], activeFileFolder);
        const remoteUrl = await execute(gitCommand, [
                "config",
                "--local",
                "--get",
                `remote.${ curRemote.trim() || fallbackRemote }.url`,
            ], activeFileFolder);

        return remoteUrl.trim();
    } catch (e) {
        container.resolve<ErrorHandler>("ErrorHandler").logError(e);
        return "";
    }
}

export async function getWorkTree(fileName: string): Promise<string> {
    const gitCommand = await getGitCommand();
    try {
        const unTrimmedWorkTree = await execute(
                gitCommand,
                ["rev-parse", "--show-toplevel"],
                dirname(fileName),
            );
        const workTree = unTrimmedWorkTree.trim();

        if (workTree === "") {
            return "";
        } else {
            return normalize(workTree);
        }
    } catch (e) {
        container.resolve<ErrorHandler>("ErrorHandler").logError(e);
        return "";
    }
}

export async function spawnGitBlameStreamProcess(
    fileName: string,
    lastSecondAbort = (): boolean => false,
): Promise<ChildProcess | undefined> {
    const args = ["blame"];

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

    if (lastSecondAbort() === false) {
        return spawn(gitCommand, args, spawnOptions);
    }
}

export async function getRelativePathOfActiveFile(): Promise<string> {
    const activeEditor = container
        .resolve<ActiveTextEditor>("ActiveTextEditor").get();

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFile = activeEditor.document.fileName;
        const activeFileFolder = dirname(activeFile);
        const activeFileName = basename(activeFile);
        const relativePath = await execute(
            gitCommand,
            ["ls-files", "--full-name", activeFileName],
            activeFileFolder,
        );

        return relativePath.trim();
    } catch (e) {
        container.resolve<ErrorHandler>("ErrorHandler").logError(e);
        return "";
    }
}
