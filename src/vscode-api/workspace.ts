import {
    Uri,
    workspace,
    WorkspaceConfiguration,
} from "vscode";

export interface Workspace {
    in(uriFile: Uri): boolean;
    has(): boolean;
    properties(): WorkspaceConfiguration;
}

export class WorkspaceImpl implements Workspace {
    public in(uriFile: Uri): boolean {
        return workspace.getWorkspaceFolder(uriFile) !== undefined;
    }

    public has(): boolean {
        return !!workspace.workspaceFolders;
    }

    public properties(): WorkspaceConfiguration {
        return workspace.getConfiguration("gitblame");
    }
}
