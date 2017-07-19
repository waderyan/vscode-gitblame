import { workspace } from 'vscode';


export enum Properties {
    CommitUrl = 'commitUrl',
    IgnoreWhitespace = 'ignoreWhitespace',
    InfoMessageFormat = 'infoMessageFormat',
    LogLevel = 'logLevel',
    ProgressSpinner = 'progressSpinner',
    StatusBarMessageFormat = 'statusBarMessageFormat',
    StatusBarMessageNoCommit = 'statusBarMessageNoCommit'
}

export function getProperty(name: Properties, defaultValue?: any): any {
    const properties = workspace.getConfiguration('gitblame');
    return properties.get(name, defaultValue);
}
