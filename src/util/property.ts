import {
    container,
    injectable,
} from "tsyringe";
import { Workspace } from "../vscode-api/workspace";

interface PropertiesMap {
    "inferCommitUrl": boolean;
    "commitUrl": string;
    "remoteName": string;
    "ignoreWhitespace": boolean;
    "infoMessageFormat": string;
    "isWebPathPlural": boolean;
    "logNonCritical": boolean;
    "statusBarMessageFormat": string;
    "statusBarMessageNoCommit": string;
    "statusBarPositionPriority": number;
    "pluralWebPathSubstrings": string[];
}

export interface Property<M = PropertiesMap> {
    get<K extends keyof M>(name: K): M[K] | undefined;
}

@injectable()
export class PropertyImpl implements Property {
    public get<K extends keyof PropertiesMap>(
        name: K,
    ): PropertiesMap[K] | undefined {
        const properties = container.resolve<Workspace>("Workspace")
            .properties();
        return properties.get(name);
    }
}
