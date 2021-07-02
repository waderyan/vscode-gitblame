export const stripGitSuffix = (rawUrl: string): string => rawUrl
    .replace(/\.git$/i, "");

export const stripGitRemoteUrl = (rawUrl: string): string => stripGitSuffix(rawUrl)
    .replace(/^[a-z-]+:\/\//i, "")
    .replace(/:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i, "/$1/");
