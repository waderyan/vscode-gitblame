import { workspace } from "vscode";
import { LogCategory } from "./errorhandler";

interface IPropertiesMap {
    "commitUrl": string;
    "ignoreWhitespace": boolean;
    "infoMessageFormat": string;
    "internalHashLength": number;
    "isWebPathPlural": boolean;
    "logLevel": LogCategory[];
    "progressSpinner": string[];
    "statusBarMessageFormat": string;
    "statusBarMessageNoCommit": string;
    "statusBarPositionPriority": number;
}

export class Property {
    public static get<K extends keyof IPropertiesMap>(
        name: K,
    ): IPropertiesMap[K] | undefined {
        const properties = workspace.getConfiguration("gitblame");
        return properties.get(name);
    }
}
