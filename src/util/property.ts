import { workspace } from "vscode";
import { LogCategory } from "./errorhandler";

interface PropertiesMap {
    "commitUrl": string;
    "ignoreWhitespace": boolean;
    "infoMessageFormat": string;
    "isWebPathPlural": boolean;
    "logLevel": LogCategory[];
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
