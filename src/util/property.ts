import { workspace } from "vscode";

export type PropertiesMap = {
    "inferCommitUrl": boolean;
    "commitUrl": string;
    "remoteName": string;
    "ignoreWhitespace": boolean;
    "infoMessageFormat": string;
    "isWebPathPlural": boolean;
    "logNonCritical": boolean;
    "statusBarMessageFormat": string;
    "statusBarMessageNoCommit": string;
    "statusBarPositionPriority": number | undefined;
    "pluralWebPathSubstrings": string[];
}

export function getProperty<Key extends keyof PropertiesMap>(
    name: Key,
    fallback: PropertiesMap[Key],
): PropertiesMap[Key];
export function getProperty<Key extends keyof PropertiesMap>(
    name: Key,
): PropertiesMap[Key] | undefined;
export function getProperty<Key extends keyof PropertiesMap>(
    name: Key,
    fallback?: PropertiesMap[Key],
): PropertiesMap[Key] | undefined {
    return workspace.getConfiguration("gitblame").get(name) ?? fallback;
}
