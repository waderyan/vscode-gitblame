import { Uri } from "vscode";
import { URL } from "url";

import type { Commit } from "./stream-parsing";

import { isUrl } from "../../util/is-url";
import { split } from "../../util/split";
import { defaultWebPath } from "./default-web-path";
import { getProperty } from "../../util/property";
import {
    getActiveFileOrigin,
    getRelativePathOfActiveFile,
    getRemoteUrl,
} from "./gitcommand";
import { projectNameFromOrigin } from "./project-name-from-origin";
import { stripGitRemoteUrl, stripGitSuffix } from "./strip-git-remote-url";
import { InfoTokens, parseTokens } from "../../util/textdecorator";
import { isUncomitted } from "./uncommitted";
import { errorMessage } from "../../util/message";
import { extensionName } from "../../extension-name";

export type ToolUrlTokens = {
    "hash": string;
    "project.name": string;
    "project.remote": string;
    "gitorigin.hostname": (index?: string) => string | undefined;
    "gitorigin.path": (index?: string) => string | undefined;
    "file.path": string;
} & InfoTokens;

function getDefaultToolUrl(
    origin: string,
    commitInfo: Commit,
): Uri | undefined {
    const attemptedURL = defaultWebPath(origin, commitInfo.hash);

    if (attemptedURL) {
        return Uri.parse(attemptedURL, true);
    }
}

function getPathIndex(path: string, index?: string, splitOn = '/'): string {
    const parts = path.split(splitOn).filter(a => !!a);
    return parts[Number(index)] || 'invalid-index';
}

function gitOriginHostname(origin: string): (index?: string) => string {
    try {
        const { hostname } = new URL(origin);
        return (index = ''): string => {
            if (index === '') {
                return hostname;
            }

            return getPathIndex(hostname, index, '.');
        };
    } catch {
        return () => 'no-origin-url'
    }
}

export function gitRemotePath(remote: string): (index?: string) => string {
    if (/^[a-z]+?@/.test(remote)) {
        const [, path] = split(remote, ':');
        return (index = ''): string => {
            if (index === '') {
                return '/' + path;
            }

            return getPathIndex(path, index);
        }
    }
    try {
        const { pathname } = new URL(remote);
        return (index = ''): string => {
            if (index === '') {
                return pathname;
            }

            return getPathIndex(pathname, index);
        };
    } catch {
        console.log(remote);
        return () => 'no-remote-url'
    }
}

export async function generateUrlTokens(commit: Commit): Promise<[string, ToolUrlTokens]> {
    const remoteName = getProperty("remoteName", "origin");

    const remote = getRemoteUrl(remoteName);
    const origin = await getActiveFileOrigin(remoteName);
    const relativePath = await getRelativePathOfActiveFile();
    const projectName = projectNameFromOrigin(origin);
    const remoteUrl = stripGitRemoteUrl(await remote);

    return [origin, {
        "hash": commit.hash,
        "project.name": projectName,
        "project.remote": remoteUrl,
        "gitorigin.hostname": gitOriginHostname(defaultWebPath(remoteUrl, "")),
        "gitorigin.path": gitRemotePath(stripGitSuffix(origin)),
        "file.path": relativePath,
    }];
}

export async function getToolUrl(
    commit?: Commit,
): Promise<Uri | undefined> {
    if (!commit || isUncomitted(commit)) {
        return;
    }

    const [origin, tokens] = await generateUrlTokens(commit);

    const parsedUrl = parseTokens(getProperty("commitUrl", ""), tokens);

    if (isUrl(parsedUrl)) {
        return Uri.parse(parsedUrl, true);
    } else if (!parsedUrl && origin) {
        return getDefaultToolUrl(origin, commit);
    } else if (!origin) {
        return undefined;
    } else {
        void errorMessage(
            `Malformed ${ extensionName }.commitUrl. Expands to: '${ parsedUrl }'`,
        );
    }
}
