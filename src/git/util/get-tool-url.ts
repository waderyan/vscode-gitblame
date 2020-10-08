import { Uri } from "vscode";
import { URL } from "url";

import type { CommitInfo } from "./stream-parsing";

import { isUrl } from "../../util/is-url";
import { defaultWebPath } from "./default-web-path";
import { getProperty } from "../../util/property";
import {
    getActiveFileOrigin,
    getRelativePathOfActiveFile,
    getRemoteUrl,
} from "./gitcommand";
import { projectNameFromOrigin } from "./project-name-from-origin";
import { stripGitRemoteUrl } from "./strip-git-remote-url";
import { parseTokens } from "../../util/textdecorator";
import { isUncomitted } from "./uncommitted";
import { errorMessage } from "../../util/message";

function getDefaultToolUrl(
    origin: string,
    commitInfo: CommitInfo,
): Uri | undefined {
    const attemptedURL = defaultWebPath(origin, commitInfo.hash);

    if (attemptedURL) {
        return Uri.parse(attemptedURL, true);
    }
}

function gitOriginHostname(origin: string): (index?: string) => string {
    const { hostname } = new URL(origin);
    return (index?: string): string => {

        if (index === '') {
            return hostname;
        }

        const parts = hostname.split('.');

        return parts[Number(index)] || 'invalid-index';
    };
}

export async function getToolUrl(
    commitInfo?: CommitInfo,
): Promise<Uri | undefined> {
    if (!commitInfo || isUncomitted(commitInfo)) {
        return;
    }

    const inferCommitUrl = getProperty("inferCommitUrl");
    const commitUrl = getProperty("commitUrl", "");
    const remoteName = getProperty("remoteName", "origin");

    const remote = getRemoteUrl(remoteName);
    const origin = await getActiveFileOrigin(remoteName);
    const relativePath = await getRelativePathOfActiveFile();
    const projectName = projectNameFromOrigin(origin);
    const remoteUrl = stripGitRemoteUrl(await remote);
    const parsedUrl = parseTokens(commitUrl, {
        "hash": (): string => commitInfo.hash,
        "project.name": (): string => projectName,
        "project.remote": (): string => remoteUrl,
        "gitorigin.hostname": gitOriginHostname(origin),
        "file.path": (): string => relativePath,
    });

    if (isUrl(parsedUrl)) {
        return Uri.parse(parsedUrl, true);
    } else if (!parsedUrl && inferCommitUrl && origin) {
        return getDefaultToolUrl(origin, commitInfo);
    } else if (!origin) {
        return undefined;
    } else {
        void errorMessage(
            `Malformed URL in gitblame.commitUrl. ` +
                `Currently expands to: '${ parsedUrl }'`,
        );
    }
}
