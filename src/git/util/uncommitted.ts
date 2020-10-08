import type { CommitInfo } from "./stream-parsing";

export function isUncomitted(commit: CommitInfo): boolean {
    return /^0{40}$/.test(commit.hash);
}
