import { ChildProcess, spawn } from "child_process";
import { basename, dirname, normalize } from "path";

import { extensions } from "vscode";

import { validEditor } from "../../util/editorvalidator";
import { getProperty } from "../../util/property";
import { Logger } from "../../util/logger";
import { execute } from "../../util/execcommand";
import { GitExtension } from "../../../types/git";
import { getActiveTextEditor } from "../../util/get-active";

export function getGitCommand(): string {
    const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

    if (vscodeGit?.exports.enabled) {
        return vscodeGit.exports.getAPI(1).git.path;
    }

    return "git";
}

async function executeWithCWD(
    command: string,
    args: string[],
    cwd: string,
): Promise<string> {
    return execute(command, args, { cwd });
}

export async function getActiveFileOrigin(remoteName: string): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    return await executeWithCWD(
        getGitCommand(),
        ["ls-remote", "--get-url", remoteName],
        dirname(activeEditor.document.fileName),
    );
}

export async function getRemoteUrl(fallbackRemote: string): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const gitCommand = getGitCommand();
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
}

export async function getWorkTree(fileName: string): Promise<string> {
    const workTree = await executeWithCWD(
        getGitCommand(),
        ["rev-parse", "--show-toplevel"],
        dirname(fileName),
    );

    if (workTree) {
        return normalize(workTree);
    }

    return "";
}

export function blameProcess(
    fileName: string,
): ChildProcess | undefined {
    const args = ["blame", "--incremental", "--", fileName];

    if (getProperty("ignoreWhitespace")) {
        args.splice(1, 0, "-w");
    }

    const gitCommand = getGitCommand();

    Logger.getInstance().command(
        `${gitCommand} ${args.join(" ")}`,
    );
    return spawn(gitCommand, args, {
        cwd: dirname(fileName),
    });
}

export async function getRelativePathOfActiveFile(): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const { fileName } = activeEditor.document;
    return await executeWithCWD(
        getGitCommand(),
        ["ls-files", "--full-name", basename(fileName)],
        dirname(fileName),
    );
}
