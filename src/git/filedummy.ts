import { GitFile } from './file';
import { ErrorHandler } from '../util/errorhandler';

export class GitFileDummy extends GitFile {
    constructor(fileName: string, disposeCallback: Function = () => {}) {
        super(fileName, disposeCallback);
        this.startCacheInterval();
        ErrorHandler.getInstance().logInfo(
            `Will not try to blame file "${
                this.fileName.fsPath
            }" as it is outside of the current workspace`
        );
    }
}
