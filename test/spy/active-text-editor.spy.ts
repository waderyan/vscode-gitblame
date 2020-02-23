import { SinonSpy, spy } from "sinon";
import { container } from "tsyringe";

import {
    ActiveTextEditor,
    ActiveTextEditorImpl,
    PartialTextEditor,
} from "../../src/vscode-api/active-text-editor";
import { Uri } from "vscode";

export function initActiveTextEditorSpy(): {
    getSpy: SinonSpy;
    nextUndefined: () => void;
} {
    const getSpy = spy();
    let shouldUndefined = false;

    container.register<ActiveTextEditor>("ActiveTextEditor", {
        useClass: class implements ActiveTextEditor {
            public get(): undefined | PartialTextEditor {
                if (shouldUndefined) {
                    shouldUndefined = false;
                    return undefined;
                }

                getSpy();
                return {
                    document: {
                        uri: Uri.file('/folder/file-name'),
                        isUntitled: false,
                        fileName: 'file-name',
                    },
                    selection: {
                        active: {
                            line: 1,
                        },
                    },
                };
            }
        },
    });

    return {
        getSpy: getSpy,
        nextUndefined: (): void => {
            shouldUndefined = true;
        },
    }
}

export function restoreActiveTextEditor(): void {
    container.register<ActiveTextEditor>("ActiveTextEditor", {
        useClass: ActiveTextEditorImpl,
    });
}
