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
    "gitorigin.hostname": string | ((index?: string) => string | undefined);
    "gitorigin.path": string | ((index?: string) => string | undefined);
    "file.path": string;
} & InfoTokens;

const getDefaultToolUrl = (origin: string, commitInfo: Commit): Uri | undefined => {
    const attemptedURL = defaultWebPath(origin, commitInfo.hash);

    if (attemptedURL) {
        return Uri.parse(attemptedURL.toString(), true);
    }
}

const getPathIndex = (path: string, index?: string, splitOn = '/'): string => {
    const parts = path.split(splitOn).filter(a => !!a);
    return parts[Number(index)] || 'invalid-index';
}

const gitOriginHostname = ({ hostname }: URL): string | ((index?: string) => string) => {
    return (index?: string): string => {
        if (index === '') {
            return hostname;
        }

        return getPathIndex(hostname, index, '.');
    };
}

export const gitRemotePath = (remote: string): string | ((index?: string) => string) => {
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
        return () => 'no-remote-url'
    }
}

const generateUrlTokens = async (commit: Commit): Promise<[string, ToolUrlTokens]> => {
    const remoteName = getProperty("remoteName");

    const origin = await getActiveFileOrigin(remoteName);
    const remoteUrl = stripGitRemoteUrl(await getRemoteUrl(remoteName));
    const defaultPath = defaultWebPath(remoteUrl, "");

    return [origin, {
        "hash": commit.hash,
        "project.name": projectNameFromOrigin(origin),
        "project.remote": remoteUrl,
        "gitorigin.hostname": defaultPath ? gitOriginHostname(defaultPath) : "no-origin-url",
        "gitorigin.path": gitRemotePath(stripGitSuffix(origin)),
        "file.path": await getRelativePathOfActiveFile(),
    }];
}

export const getToolUrl = async (commit?: Commit): Promise<Uri | undefined> => {
    if (!commit || isUncomitted(commit)) {
        return;
    }

    const [origin, tokens] = await generateUrlTokens(commit);

    const parsedUrl = parseTokens(getProperty("commitUrl"), tokens);

    if (isUrl(parsedUrl)) {
        return Uri.parse(parsedUrl, true);
    } else if (!parsedUrl && origin) {
        return getDefaultToolUrl(origin, commit);
    } else if (origin) {
        void errorMessage(`Malformed ${ extensionName }.commitUrl: '${ parsedUrl }'`);
    }
}
