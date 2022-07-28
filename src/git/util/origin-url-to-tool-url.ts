import { URL } from "url";

import { stripGitRemoteUrl } from "./strip-git-remote-url";

export const originUrlToToolUrl = (url: string): URL | undefined => {
    const httpProtocol = /^(https?):/.exec(url)?.[1];

    let uri: URL;

    try {
        uri = new URL(`${ httpProtocol ?? "https" }://${stripGitRemoteUrl(url)}`);
    } catch (err) {
        return;
    }

    uri.port = httpProtocol ? uri.port : "";

    return uri;
}
