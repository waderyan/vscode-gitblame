export function appendOrNot(count: number, singular: string): string {
    return `${ count } ${singular}${ count === 1 ? "" : "s" } ago`;
}
