import { GitFile } from "git/file";
import { ErrorHandler } from "util/errorhandler";

export class GitFileDummy extends GitFile {
    constructor(fileName: string, disposeCallback: () => void) {
        super(fileName, disposeCallback);
        this.startCacheInterval();
        ErrorHandler.logInfo(
            `Will not try to blame file "${
                this.fileName.fsPath
            }" as it is outside of the current workspace`,
        );
    }
}
