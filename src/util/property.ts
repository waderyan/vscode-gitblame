import { workspace } from "vscode";
import { extensionName } from "../extension-name";

export type PropertiesMap = {
    "commitUrl": string;
    "remoteName": string;
    "ignoreWhitespace": boolean;
    "infoMessageFormat": string;
    "isWebPathPlural": boolean;
    "statusBarMessageFormat": string;
    "statusBarMessageNoCommit": string;
    "statusBarPositionPriority": number | undefined;
    "pluralWebPathSubstrings": string[];
}

type PropertyFunction = {
    <Key extends keyof PropertiesMap>(
        name: Key,
        fallback: PropertiesMap[Key],
    ): PropertiesMap[Key];
    <Key extends keyof PropertiesMap>(
        name: Key,
    ): PropertiesMap[Key] | undefined;
}

export const getProperty: PropertyFunction = <Key extends keyof PropertiesMap>(
    name: Key,
    fallback?: PropertiesMap[Key],
): PropertiesMap[Key] | undefined => workspace.getConfiguration(extensionName).get(name) ?? fallback;
