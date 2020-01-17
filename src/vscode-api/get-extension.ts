import {
    Extension,
    extensions,
} from "vscode";
import { GitExtension } from "../../types/git";

export interface ExtensionGetter {
    get(): undefined | Extension<GitExtension>;
}

export class ExtensionGetterImpl implements ExtensionGetter {
    public get(): undefined | Extension<GitExtension> {
        return extensions.getExtension("vscode.git");
    }
}
