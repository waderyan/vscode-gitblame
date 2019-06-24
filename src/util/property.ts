import { workspace } from "vscode";

interface PropertiesMap {
    "inferCommitUrl": boolean;
    "commitUrl": string;
    "ignoreWhitespace": boolean;
    "infoMessageFormat": string;
    "isWebPathPlural": boolean;
    "logNonCritical": boolean;
    "statusBarMessageFormat": string;
    "statusBarMessageNoCommit": string;
    "statusBarPositionPriority": number;
    "pluralWebPathSubstrings": string[];
}

export class Property {
    public static get<K extends keyof PropertiesMap>(
        name: K,
    ): PropertiesMap[K] | undefined {
        const properties = workspace.getConfiguration("gitblame");
        return properties.get(name);
    }
}
