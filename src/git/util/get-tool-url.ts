import { Uri } from "vscode";
import { URL } from "url";

import type { LineAttatchedCommit } from "./stream-parsing";

import { isUrl } from "../../util/is-url";
import { split } from "../../util/split";
import { originUrlToToolUrl } from "./origin-url-to-tool-url";
import { getProperty } from "../../util/property";
import { getActiveFileOrigin, getRelativePathOfActiveFile, getRemoteUrl } from "./gitcommand";
import { projectNameFromOrigin } from "./project-name-from-origin";
import { stripGitRemoteUrl, stripGitSuffix } from "./strip-git-remote-url";
import { InfoTokens, parseTokens } from "../../util/textdecorator";
import { isUncomitted } from "./uncommitted";
import { errorMessage } from "../../util/message";

export type ToolUrlTokens = {
    "hash": string;
    "project.name": string;
    "project.remote": string;
    "gitorigin.hostname": string | ((index?: string) => string | undefined);
    "gitorigin.path": string | ((index?: string) => string | undefined);
    "file.path": string;
    "file.path.result": string;
    "file.path.source": string;
    "file.line": string;
    "file.line.result": string;
    "file.line.source": string;
} & InfoTokens;

const getPathIndex = (path: string, index?: string, splitOn = "/"): string => {
    const parts = path.split(splitOn).filter(a => !!a);
    return parts[Number(index)] || "invalid-index";
}

const gitOriginHostname = ({ hostname }: URL): string | ((index?: string) => string) => {
    return (index?: string): string => {
        if (index === "") {
            return hostname;
        }

        return getPathIndex(hostname, index, ".");
    };
}

export const gitRemotePath = (remote: string): string | ((index?: string) => string) => {
    if (/^[a-z]+?@/.test(remote)) {
        const [, path] = split(remote, ":");
        return (index = ""): string => {
            if (index === "") {
                return "/" + path;
            }

            return getPathIndex(path, index);
        }
    }
    try {
        const { pathname } = new URL(remote);
        return (index = ""): string => {
            if (index === "") {
                return pathname;
            }

            return getPathIndex(pathname, index);
        };
    } catch {
        return () => "no-remote-url"
    }
}

const isToolUrlPlural = (origin: string): boolean => getProperty("pluralWebPathSubstrings")
    .some(
        (substring) => origin.includes(substring),
    );

export const generateUrlTokens = async (lineAware: LineAttatchedCommit): Promise<ToolUrlTokens> => {
    const remoteName = getProperty("remoteName");

    const origin = await getActiveFileOrigin(remoteName);
    const remoteUrl = stripGitRemoteUrl(await getRemoteUrl(remoteName));
    const tool = originUrlToToolUrl(remoteUrl);
    const filePath = await getRelativePathOfActiveFile();

    return {
        "hash": lineAware.commit.hash,
        "tool.protocol": tool?.protocol ?? "https:",
        "tool.commitpath": `/commit${isToolUrlPlural(remoteUrl) ? "s" : ""}/`,
        "project.name": projectNameFromOrigin(origin),
        "project.remote": remoteUrl,
        "gitorigin.hostname": tool ? gitOriginHostname(tool) : "no-origin-url",
        "gitorigin.path": gitRemotePath(stripGitSuffix(origin)),
        "gitorigin.port": tool?.port ? `:${tool.port}` : "",
        "file.path": filePath,
        "file.path.result": filePath,
        "file.path.source": lineAware.filename,
        "file.line": lineAware.line.result.toString(),
        "file.line.result": lineAware.line.result.toString(),
        "file.line.source": lineAware.line.source.toString(),
    };
}

export const getToolUrl = async (commit?: LineAttatchedCommit): Promise<Uri | undefined> => {
    if (!commit || isUncomitted(commit.commit)) {
        return;
    }

    const parsedUrl = parseTokens(
        getProperty("commitUrl"),
        await generateUrlTokens(commit),
    );

    if (isUrl(parsedUrl)) {
        return Uri.parse(parsedUrl, true);
    } else {
        errorMessage(`Malformed gitblame.commitUrl: '${parsedUrl}' from '${getProperty("commitUrl")}'`);
    }
}
