import { Uri } from "vscode";
import { URL } from "url";

import type { Commit } from "./stream-parsing";

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
    commitInfo: Commit,
): Uri | undefined {
    const attemptedURL = defaultWebPath(origin, commitInfo.hash);

    if (attemptedURL) {
        return Uri.parse(attemptedURL, true);
    }
}

function gitOriginHostname(origin: string): (index?: string) => string {
    try {
        const { hostname } = new URL(origin);
        return (index?: string): string => {

            if (index === '') {
                return hostname;
            }

            const parts = hostname.split('.');

            return parts[Number(index)] || 'invalid-index';
        };
    } catch {
        return () => 'no-origin-url'
    }
}

export async function getToolUrl(
    commit?: Commit,
): Promise<Uri | undefined> {
    if (!commit || isUncomitted(commit)) {
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
        "hash": commit.hash,
        "project.name": projectName,
        "project.remote": remoteUrl,
        "gitorigin.hostname": gitOriginHostname(defaultWebPath(remoteUrl, "")),
        "file.path": relativePath,
    });

    if (isUrl(parsedUrl)) {
        return Uri.parse(parsedUrl, true);
    } else if (!parsedUrl && inferCommitUrl && origin) {
        return getDefaultToolUrl(origin, commit);
    } else if (!origin) {
        return undefined;
    } else {
        void errorMessage(
            `Malformed gitblame.commitUrl. Expands to: '${ parsedUrl }'`,
        );
    }
}
