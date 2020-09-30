import { URL } from "url";

import { getProperty } from "../../util/property";
import { stripGitRemoteUrl } from "./strip-git-remote-url";

function isToolUrlPlural(origin: string): boolean {
    const isWebPathPlural = getProperty("isWebPathPlural");
    const urlParts = getProperty("pluralWebPathSubstrings", []);

    return isWebPathPlural || urlParts.some(
        (substring): boolean => origin.includes(substring),
    );
}

function httpOrHttps(url: string): "http" | "https" | undefined {
    if (url.startsWith("https://")) {
        return "https";
    } else if (url.startsWith("http://")) {
        return "http";
    }
}

export function defaultWebPath(
    url: string,
    hash: string,
): string {
    const isPlural = isToolUrlPlural(url);
    const httpProtocol = httpOrHttps(url);
    const gitlessUrl = stripGitRemoteUrl(url);

    let uri: URL;

    try {
        uri = new URL(`${ httpProtocol ?? "https" }://${ gitlessUrl }`);
    } catch (err) {
        return "";
    }

    const commit = isPlural ? "commits" : "commit";
    const port = httpProtocol && uri.port ? `:${ uri.port }` : "";
    const protocol = uri.protocol;

    return `${ protocol }//` +
        `${ uri.hostname }${ port }` +
        `${ uri.pathname }/${ commit }/${ hash }`;
}
