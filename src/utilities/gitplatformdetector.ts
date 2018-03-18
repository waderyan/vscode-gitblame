export class GitPlatformDetector {
    public static defaultPath(url: string, hash: string): string {
        return url.replace(
            /^(git@|https:\/\/)([^:\/]+)[:\/](.*)\.git$/,
            `https://$2/$3/commit/${ hash }`,
        );
    }
}
