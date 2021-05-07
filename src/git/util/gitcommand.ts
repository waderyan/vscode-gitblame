import { ChildProcess, spawn } from "child_process";
import { basename, dirname } from "path";

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

async function runGit(cwd: string, ...args: string[]): Promise<string> {
    return execute(getGitCommand(), args, { cwd: dirname(cwd) });
}

export async function getActiveFileOrigin(remoteName: string): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    return await runGit(activeEditor.document.fileName, "ls-remote", "--get-url", remoteName);
}

export async function getRemoteUrl(fallbackRemote: string): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const { fileName } = activeEditor.document;
    const currentBranch = await runGit(fileName, "symbolic-ref", "-q", "--short", "HEAD");
    const curRemote = await runGit(fileName, "config", `branch.${ currentBranch }.remote`);
    return runGit(fileName, "config", `remote.${ curRemote || fallbackRemote }.url`);
}

export async function isGitTracked(fileName: string): Promise<boolean> {
    return !!await runGit(fileName, "rev-parse", "--git-dir");
}

export function blameProcess(fileName: string): ChildProcess {
    const args = ["blame", "--incremental", "--", fileName];

    if (getProperty("ignoreWhitespace")) {
        args.splice(1, 0, "-w");
    }

    const gitCommand = getGitCommand();

    Logger.command(`${gitCommand} ${args.join(" ")}`);

    return spawn(gitCommand, args, {
        cwd: fileName,
    });
}

export async function getRelativePathOfActiveFile(): Promise<string> {
    const activeEditor = getActiveTextEditor();

    if (!validEditor(activeEditor)) {
        return "";
    }

    const { fileName } = activeEditor.document;
    return await runGit(fileName, "ls-files", "--full-name", basename(fileName));
}
