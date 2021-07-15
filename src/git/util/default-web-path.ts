import { URL } from "url";

import { getProperty } from "../../util/property";
import { stripGitRemoteUrl } from "./strip-git-remote-url";

const isToolUrlPlural = (origin: string): boolean => getProperty("isWebPathPlural")
    || (getProperty("pluralWebPathSubstrings") ?? []).some((substring) => origin.includes(substring));

export const defaultWebPath = (url: string, hash: string): URL | undefined => {
    const httpProtocol = /^(https?):/.exec(url)?.[1];

    let uri: URL;

    try {
        uri = new URL(`${ httpProtocol ?? "https" }://${ stripGitRemoteUrl(url) }`);
    } catch (err) {
        return;
    }

    uri.port = httpProtocol ? uri.port : "";
    uri.pathname += `/commit${isToolUrlPlural(url) ? "s" : ""}/${ hash }`;

    return uri;
}
