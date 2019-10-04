import {
    Extension,
    extensions,
} from "vscode";

export interface ExtensionGetter {
    get<T>(extensionId: string): undefined | Extension<T>;
}

export class ExtensionGetterImpl implements ExtensionGetter {
    public get<T>(extensionId: string): undefined | Extension<T> {
        return extensions.getExtension<T>(extensionId);
    }
}
