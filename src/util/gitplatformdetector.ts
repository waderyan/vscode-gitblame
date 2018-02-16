import URL = require('url');
import HTTP = require('http');
import HTTPS = require('https');

const acceptableStatusCodes = [
    200,
    302,
    307
];

export class GitPlatformDetector {
    static cleanUrl (url: string): string {
        const nonSshUrl = url.replace(/^git@/, 'http://').replace(/:([^0-9\/])/, '/$1');
        const parts = URL.parse(nonSshUrl);
        const path = parts.path.replace('.git', '/');

        return `${ parts.protocol }//${ parts.host }${ path }`;
    }

    static async testUrl (url: string): Promise<boolean> {
        return GitPlatformDetector.requestStatusCode(url).then((statusCode => {
            return Promise.resolve(acceptableStatusCodes.includes(statusCode));
        }))
    }

    static async requestStatusCode (url: string): Promise<number> {
        return GitPlatformDetector.request(url).then(request => request.statusCode);
    }

    static request(url: string): Promise<HTTP.IncomingMessage> {
        return new Promise(resolve => {
            if (url.substr(0, 5) === 'https') {
                HTTPS.get(url, resolve);
            }
            else {
                HTTP.get(url, resolve);
            }
        });
    }
}