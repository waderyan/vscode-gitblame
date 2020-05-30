import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";
import {
    Disposable,
    Extension,
    Uri,
} from "vscode";

import {
    ExtensionGetter,
    ExtensionGetterImpl,
} from "../../src/vscode-api/get-extension";
import { API, GitExtension } from "../../types/git";

export function initExtensionGetterSpy(): {
    apiSpy: SinonSpy;
} {
    const apiSpy = spy();

    container.register<ExtensionGetter>("ExtensionGetter", {
        useClass: class implements ExtensionGetter {
            public get(): Extension<GitExtension> | undefined {
                const api = {
                    id: 'id',
                    extensionPath: '/extension/path',
                    extensionUri: Uri.parse('/extension/path'),
                    isActive: true,
                    packageJSON: {},
                    extensionKind: 1,
                    activate: (): Thenable<GitExtension> => ({
                        then: (): Promise<typeof api> => Promise.resolve(api),
                    }),
                    exports: {
                        enabled: true,
                        getAPI(): API {
                            apiSpy();
                            return {
                                state: 'initialized',
                                onDidChangeState: (): Disposable =>
                                    ({dispose: (): void => undefined}),
                                git: {
                                    path: 'git',
                                },
                            };
                        },
                    },
                };

                return api;
            }
        },
    });

    return {
        apiSpy,
    }
}

export function restoreExtensionGetter(): void {
    container.register<ExtensionGetter>("ExtensionGetter", {
        useClass: ExtensionGetterImpl,
    });
}
