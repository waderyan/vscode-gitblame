export function stripGitRemoteUrl(rawUrl: string): string {
    return stripGitSuffix(rawUrl)
        .replace(/^[a-z-]+:\/\//i, "")
        .replace(/:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i, "/$1/");
}

export const stripGitSuffix = (rawUrl: string): string => rawUrl
    .replace(/\.git$/i, "");
