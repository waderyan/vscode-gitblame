import { window } from "vscode";

import { TIME_CACHE_LIFETIME } from "../constants";
import { ErrorHandler } from "../util/errorhandler";
import { blankBlameInfo, GitBlameInfo } from "./util/blanks";

export class GitFile {
    public readonly fileName: string;
    public disposeCallback: () => void;

    private cacheClearInterval: NodeJS.Timer | undefined;

    public constructor(fileName: string, disposeCallback: () => void) {
        this.fileName = fileName;
        this.disposeCallback = disposeCallback;
    }

    public startCacheInterval(): void {
        this.clearCacheInterval();

        this.cacheClearInterval = setInterval((): void => {
            const isOpen = window.visibleTextEditors.some(
                (editor): boolean => (
                    editor.document.uri.fsPath === this.fileName
                ),
            );

            if (!isOpen) {
                ErrorHandler.logInfo(
                    `Clearing the file "${
                        this.fileName
                    }" from the internal cache`,
                );
                this.dispose();
            }
        }, TIME_CACHE_LIFETIME);
    }

    public async blame(): Promise<GitBlameInfo> {
        return blankBlameInfo();
    }

    public dispose(): void {
        this.clearCacheInterval();

        this.disposeCallback();
        delete this.disposeCallback;
    }

    private clearCacheInterval(): void {
        if (this.cacheClearInterval !== undefined) {
            clearInterval(this.cacheClearInterval);
        }
    }
}
