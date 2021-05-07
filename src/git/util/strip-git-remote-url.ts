export function stripGitRemoteUrl(rawUrl: string): string {
    return rawUrl
        .replace(/(^[a-z-]+:\/\/|\.git$)/ig, "")
        .replace(/:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i, "/$1/");
}
