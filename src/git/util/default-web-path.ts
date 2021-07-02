import { URL } from "url";

import { getProperty } from "../../util/property";
import { stripGitRemoteUrl } from "./strip-git-remote-url";

const isToolUrlPlural = (origin: string): boolean => getProperty("isWebPathPlural")
    || getProperty("pluralWebPathSubstrings").some((substring) => origin.includes(substring));

const httpOrHttps = (url: string): string | undefined => /^(https?):/.exec(url)?.[1];

export const defaultWebPath = (url: string, hash: string): string => {
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
