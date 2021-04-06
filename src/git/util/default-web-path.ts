import { URL } from "url";

import { getProperty } from "../../util/property";
import { stripGitRemoteUrl } from "./strip-git-remote-url";

function isToolUrlPlural(origin: string): boolean {
    const isWebPathPlural = getProperty("isWebPathPlural");
    const urlParts = getProperty("pluralWebPathSubstrings", []);

    return isWebPathPlural || urlParts.some(
        (substring) => origin.includes(substring),
    );
}

function httpOrHttps(url: string): string | undefined {
    const matches = /^(https?):/.exec(url);
    if (matches !== null) {
        return matches[1];
    }
}

export function defaultWebPath(url: string, hash: string): string {
    const httpProtocol = httpOrHttps(url);
    const gitlessUrl = stripGitRemoteUrl(url);

    let uri: URL;

    try {
        uri = new URL(`${ httpProtocol || "https" }://${ gitlessUrl }`);
    } catch (err) {
        return "";
    }

    const commit = `commit${isToolUrlPlural(url) ? "s" : ""}`;
    const port = httpProtocol && uri.port ? `:${ uri.port }` : "";

    return `${ uri.protocol }//${ uri.hostname }${ port }${ uri.pathname }/${ commit }/${ hash }`;
}
