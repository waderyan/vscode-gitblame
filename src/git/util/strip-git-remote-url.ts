export const stripGitSuffix = (rawUrl: string): string => rawUrl
// Remove protocol, username and/or password, and .git-suffix
    .replace(/\.git$/i, "");

export const stripGitRemoteUrl = (rawUrl: string): string => stripGitSuffix(rawUrl)
    // Remove protocol, username and/or password, and .git-suffix
    .replace(/^([a-z-]+:\/\/)?([\w%:\\]+?@)?/i, "")
    // Convert hostname:path to hostname/path
    .replace(/:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i, "/$1/");
