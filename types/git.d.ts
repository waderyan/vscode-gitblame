import { Event } from 'vscode';

export interface Git {
    readonly path: string;
}

export type APIState = 'uninitialized' | 'initialized';

export interface API {
    readonly state: APIState;
    readonly onDidChangeState: Event<APIState>;
    readonly git: Git;
}

export interface GitExtension {
    readonly enabled: boolean;
    getAPI(version: 1): API;
}
