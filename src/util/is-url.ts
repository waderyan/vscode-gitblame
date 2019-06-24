import { URL } from "url";

export function isUrl(check: string): boolean {
    let url: URL;
    try {
        url = new URL(check);
    } catch (err) {
        return false;
    }

    if (url.href !== check) {
        return false;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
    }

    if (url.hostname === '') {
        return false;
    }

    if (url.pathname === '') {
        return false;
    }

    return true;
}
