import { ErrorHandler } from "../util/errorhandler";
import { GitFile } from "./file";

export class GitFileDummy extends GitFile {
    public constructor(fileName: string, disposeCallback: () => void) {
        super(fileName, disposeCallback);
        this.startCacheInterval();
        ErrorHandler.logInfo(
            `Will not try to blame file "${
                this.fileName.fsPath
            }" as it is outside of the current workspace`,
        );
    }
}
