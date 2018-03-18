import { Disposable, workspace } from "vscode";

export enum Properties {
    CommitUrl = "commitUrl",
    IgnoreWhitespace = "ignoreWhitespace",
    InfoMessageFormat = "infoMessageFormat",
    InternalHashLength = "internalHashLength",
    LogLevel = "logLevel",
    ProgressSpinner = "progressSpinner",
    StatusBarMessageFormat = "statusBarMessageFormat",
    StatusBarMessageNoCommit = "statusBarMessageNoCommit",
    StatusBarPositionPriority = "statusBarPositionPriority",
}

export class Property {
    public static getInstance(): Property {
        if (!Property.instance) {
            Property.instance = new Property();
        }

        return Property.instance;
    }

    public static get(name: Properties, defaultValue?: any): any {
        return Property.getInstance().getProperty(name, defaultValue);
    }

    private static instance: Property;
    private properties: { [property: string]: any } = {};
    private disposable: Disposable;

    private constructor() {
        this.setupListeners();
        this.getProperties();
    }

    public setupListeners(): void {
        const disposables: Disposable[] = [];

        workspace.onDidSaveTextDocument(this.getProperties, this, disposables);

        this.disposable = Disposable.from(this.disposable, ...disposables);
    }

    public getProperty(name: Properties, defaultValue?: any): any {
        const potentialPropertyValue = this.properties[name];

        if (
            potentialPropertyValue === null &&
            typeof defaultValue !== "undefined"
        ) {
            return defaultValue;
        } else {
            return potentialPropertyValue;
        }
    }

    public dispose(): void {
        this.disposable.dispose();
    }

    private getPropertyFromConfiguration(name: Properties): any {
        const properties = workspace.getConfiguration("gitblame");
        return properties.get(name);
    }

    private getProperties(): void {
        const properties = {
            commitUrl: this.getPropertyFromConfiguration(
                Properties.CommitUrl,
            ),
            ignoreWhitespace: this.getPropertyFromConfiguration(
                Properties.IgnoreWhitespace,
            ),
            infoMessageFormat: this.getPropertyFromConfiguration(
                Properties.InfoMessageFormat,
            ),
            internalHashLength: this.getPropertyFromConfiguration(
                Properties.InternalHashLength,
            ),
            logLevel: this.getPropertyFromConfiguration(
                Properties.LogLevel,
            ),
            progressSpinner: this.getPropertyFromConfiguration(
                Properties.ProgressSpinner,
            ),
            statusBarMessageFormat: this.getPropertyFromConfiguration(
                Properties.StatusBarMessageFormat,
            ),
            statusBarMessageNoCommit: this.getPropertyFromConfiguration(
                Properties.StatusBarMessageNoCommit,
            ),
            statusBarPositionPriority: this.getPropertyFromConfiguration(
                Properties.StatusBarPositionPriority,
            ),
        };

        this.properties = properties;
    }
}
