export function projectNameFromOrigin(origin: string): string {
    const match = /([a-zA-Z0-9_~%+.-]*?(\.git)?)$/.exec(origin);
    if (!match) {
        return "";
    }

    return match[1].replace(".git", "");
}
