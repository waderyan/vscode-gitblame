import { get as httpGet, IncomingMessage } from "http";
import { get as httpsGet } from "https";
import { parse } from "url";

// import URL = require('url');
// import HTTP = require('http');
// import HTTPS = require('https');

const acceptableStatusCodes = [200, 302, 307];

export class GitPlatformDetector {
    public static cleanUrl(url: string): string {
        const nonSshUrl = url
            .replace(/^git@/, "http://")
            .replace(/:([^0-9\/])/, "/$1");
        const parts = parse(nonSshUrl);
        const path = parts.path.replace(".git", "/");

        return `${parts.protocol}//${parts.host}${path}`;
    }

    public static async testUrl(url: string): Promise<boolean> {
        return GitPlatformDetector.requestStatusCode(url).then((statusCode) => {
            return Promise.resolve(acceptableStatusCodes.includes(statusCode));
        });
    }

    public static async requestStatusCode(url: string): Promise<number> {
        return GitPlatformDetector.request(url).then(
            (request) => request.statusCode,
        );
    }

    public static request(url: string): Promise<IncomingMessage> {
        return new Promise((resolve) => {
            if (url.substr(0, 5) === "https") {
                httpsGet(url, resolve);
            } else {
                httpGet(url, resolve);
            }
        });
    }
}
