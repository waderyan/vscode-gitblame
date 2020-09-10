export function httpOrHttps(url: string): "http" | "https" | undefined {
    if (url.startsWith("https://")) {
        return "https";
    } else if (url.startsWith("http://")) {
        return "http";
    }
}
