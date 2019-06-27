export function stripGitRemoteUrl(rawUrl: string): string {
    const httplessUrl = rawUrl.replace(/^[a-z-]+:\/\//i, "");
    const colonlessUrl = httplessUrl.replace(
        /:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i,
        "/$1/",
    );
    return colonlessUrl.replace(/\.git$/i, "");
}
