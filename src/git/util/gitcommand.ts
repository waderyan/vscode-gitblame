import { ChildProcess, spawn } from "child_process";
import { basename, dirname, normalize } from "path";

import { extensions } from "vscode";

import { validEditor } from "../../util/editorvalidator";
import { getProperty } from "../../util/property";
import { Logger } from "../../util/logger";
import { execute } from "../../util/execcommand";
import { GitExtension } from "../../../types/git";
import { getActiveTextEditor } from "../../util/get-active";

export async function getGitCommand(): Promise<string> {
    const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

    if (vscodeGit?.exports.enabled) {
        const api = vscodeGit.exports.getAPI(1);
        if (api.state === "initialized") {
            return Promise.resolve(api.git.path);
        } else {
            return new Promise((resolve): void => {
                const change = api.onDidChangeState((newState): void => {
                    if (newState === "initialized") {
                        resolve(api.git.path);
                        change.dispose();
                    }
                });
            });
        }
    }

    return Promise.resolve("git");
}

async function executeWithCWD(
    command: Promise<string> | string,
    args: string[],
    cwd: string,
): Promise<string> {
    return execute(await command, args, { cwd });
}

export async function getActiveFileOrigin(remoteName: string): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        return await executeWithCWD(
            getGitCommand(),
            ["ls-remote", "--get-url", remoteName],
            dirname(activeEditor.document.fileName),
        );
    } catch (e) {
        Logger.getInstance().error(e);
        return "";
    }
}

export async function getRemoteUrl(fallbackRemote: string): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const gitCommand = await getGitCommand();
        const activeFileFolder = dirname(activeEditor.document.fileName);
        const currentBranch = await executeWithCWD(
            gitCommand,
            ["symbolic-ref", "-q", "--short", "HEAD"],
            activeFileFolder,
        );
        const curRemote = await executeWithCWD(
            gitCommand,
            ["config", "--local", "--get", `branch.${ currentBranch }.remote`],
            activeFileFolder,
        );
        const remote = curRemote || fallbackRemote;
        const remoteUrl = await executeWithCWD(
            gitCommand,
            ["config", "--local", "--get", `remote.${ remote }.url`],
            activeFileFolder,
        );

        return remoteUrl;
    } catch (e) {
        Logger.getInstance().error(e);
        return "";
    }
}

export async function getWorkTree(fileName: string): Promise<string> {
    try {
        const workTree = await executeWithCWD(
            getGitCommand(),
            ["rev-parse", "--show-toplevel"],
            dirname(fileName),
        );

        if (workTree) {
            return normalize(workTree);
        }
    } catch (e) {
        Logger.getInstance().error(e);
    }

    return "";
}

export async function blameProcess(
    fileName: string,
    lastSecondAbort = () => false,
): Promise<ChildProcess | undefined> {
    const args = ["blame", "--incremental", "--", fileName];

    if (getProperty("ignoreWhitespace")) {
        args.splice(1, 0, "-w");
    }

    const gitCommand = await getGitCommand();

    if (!lastSecondAbort()) {
        Logger.getInstance().command(
            `${gitCommand} ${args.join(" ")}`,
        );
        return spawn(gitCommand, args, {
            cwd: dirname(fileName),
        });
    }
}

export async function getRelativePathOfActiveFile(): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    try {
        const { fileName } = activeEditor.document;
        return await executeWithCWD(
            getGitCommand(),
            ["ls-files", "--full-name", basename(fileName)],
            dirname(fileName),
        );
    } catch (e) {
        Logger.getInstance().error(e);
        return "";
    }
}
