import { Uri, window } from "vscode";
import { URL } from "url";

import { isUrl } from "../../util/is-url";
import { CommitInfo, isUncomitted } from "./blanks";
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

function getDefaultToolUrl(
    origin: string,
    commitInfo: CommitInfo,
): Uri | undefined {
    const attemptedURL = defaultWebPath(origin, commitInfo.hash);

    if (attemptedURL) {
        return Uri.parse(attemptedURL, true);
    }
}

function gitOriginHostname(origin: string): (index: string) => string {
    return (index: string): string => {
        const originUrl = new URL(origin);

        if (index === '') {
            return originUrl.hostname;
        }

        const parts = originUrl.hostname.split('.');

        if (index !== undefined && index in parts) {
            return parts[Number(index)];
        }

        return 'invalid-index';
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

    const remote = await getRemoteUrl(remoteName);
    const origin = await getActiveFileOrigin(remoteName);
    const relativePath = await getRelativePathOfActiveFile();
    const projectName = projectNameFromOrigin(origin);
    const remoteUrl = stripGitRemoteUrl(remote);
    const parsedUrl = parseTokens(commitUrl, {
        "hash": (): string => commitInfo.hash,
        "project.name": (): string => projectName,
        "project.remote": (): string => remoteUrl,
        "gitorigin.hostname": gitOriginHostname(origin),
        "file.path": (): string => relativePath,
    });

    if (isUrl(parsedUrl)) {
        return Uri.parse(parsedUrl, true);
    } else if (parsedUrl === '' && inferCommitUrl && origin) {
        return getDefaultToolUrl(origin, commitInfo);
    } else if (!origin) {
        return undefined;
    } else {
        void window.showErrorMessage(
            `Malformed URL in gitblame.commitUrl. ` +
                `Currently expands to: '${ parsedUrl }'`,
        );
    }
}
