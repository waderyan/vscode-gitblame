export function projectNameFromOrigin(origin: string): string {
    const match = /(([a-zA-Z0-9_~%+.-]*?)(\.git)?)$/.exec(origin);
    return match?.[2] ?? "";
}
